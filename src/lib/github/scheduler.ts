import { ForensicRateLimitError, ForensicGitHubError } from "./errors";

export interface RateLimitStatus {
  limit: number;
  remaining: number;
  resetTimeEpoch: number; // in seconds
  resetTimeIso: string;
  isThrottled: boolean;
}

export interface SchedulerOptions {
  maxConcurrency?: number;
  maxRetries?: number;
  baseDelayMs?: number;
  onRateLimitWarning?: (status: RateLimitStatus, message: string) => void;
}

interface QueuedTask<T> {
  fn: () => Promise<T>;
  resolve: (value: T | PromiseLike<T>) => void;
  reject: (reason?: unknown) => void;
  retries: number;
  cacheKey?: string;
}

export class ForensicRequestScheduler {
  private maxConcurrency: number;
  private maxRetries: number;
  private baseDelayMs: number;
  private currentRunning: number = 0;
  private queue: QueuedTask<unknown>[] = [];
  private inFlightPromises = new Map<string, Promise<unknown>>();
  private rateLimitStatus: RateLimitStatus = {
    limit: 5000,
    remaining: 5000,
    resetTimeEpoch: 0,
    resetTimeIso: new Date().toISOString(),
    isThrottled: false,
  };
  private isPaused: boolean = false;
  private pauseUntilTimestamp: number = 0;
  private onRateLimitWarning?: (status: RateLimitStatus, message: string) => void;

  constructor(options: SchedulerOptions = {}) {
    this.maxConcurrency = options.maxConcurrency ?? 4;
    this.maxRetries = options.maxRetries ?? 3;
    this.baseDelayMs = options.baseDelayMs ?? 800;
    this.onRateLimitWarning = options.onRateLimitWarning;
  }

  public getRateLimitStatus(): RateLimitStatus {
    return { ...this.rateLimitStatus };
  }

  public schedule<T>(fn: () => Promise<T>, cacheKey?: string): Promise<T> {
    if (cacheKey && this.inFlightPromises.has(cacheKey)) {
      return this.inFlightPromises.get(cacheKey) as Promise<T>;
    }

    const promise = new Promise<T>((resolve, reject) => {
      this.queue.push({
        fn: fn as () => Promise<unknown>,
        resolve: resolve as (value: unknown) => void,
        reject,
        retries: 0,
        cacheKey,
      });
      this.processQueue();
    });

    if (cacheKey) {
      this.inFlightPromises.set(cacheKey, promise);
      promise.finally(() => {
        this.inFlightPromises.delete(cacheKey);
      });
    }

    return promise;
  }

  private async processQueue(): Promise<void> {
    if (this.isPaused || this.currentRunning >= this.maxConcurrency || this.queue.length === 0) {
      return;
    }

    const now = Date.now();
    if (this.pauseUntilTimestamp > now) {
      this.isPaused = true;
      const waitMs = this.pauseUntilTimestamp - now;
      setTimeout(() => {
        this.isPaused = false;
        this.processQueue();
      }, waitMs);
      return;
    }

    const task = this.queue.shift();
    if (!task) return;

    this.currentRunning++;

    try {
      const result = await task.fn();
      task.resolve(result);
    } catch (err: unknown) {
      await this.handleTaskError(err, task);
    } finally {
      this.currentRunning--;
      this.processQueue();
    }
  }

  private async handleTaskError(err: unknown, task: QueuedTask<unknown>): Promise<void> {
    const errorObj = err as {
      status?: number;
      statusCode?: number;
      message?: string;
      response?: {
        headers?: Record<string, string>;
        status?: number;
        data?: { message?: string };
      };
      headers?: Record<string, string>;
    };

    const status = errorObj.status || errorObj.statusCode || errorObj.response?.status;
    const headers = errorObj.headers || errorObj.response?.headers || {};
    const message = errorObj.response?.data?.message || errorObj.message || "Unknown error";

    // Rate Limit Parsing
    const remaining = headers["x-ratelimit-remaining"];
    const resetEpoch = headers["x-ratelimit-reset"];
    const retryAfter = headers["retry-after"];

    if (remaining !== undefined) {
      this.rateLimitStatus.remaining = parseInt(remaining, 10);
    }
    if (resetEpoch !== undefined) {
      this.rateLimitStatus.resetTimeEpoch = parseInt(resetEpoch, 10);
      this.rateLimitStatus.resetTimeIso = new Date(this.rateLimitStatus.resetTimeEpoch * 1000).toISOString();
    }

    const isSecondaryRateLimit =
      status === 403 &&
      (message.toLowerCase().includes("secondary rate limit") ||
        message.toLowerCase().includes("abuse detection") ||
        message.toLowerCase().includes("please wait"));

    const isPrimaryRateLimit = status === 403 && this.rateLimitStatus.remaining === 0;

    if (isPrimaryRateLimit || isSecondaryRateLimit || status === 429) {
      let pauseDurationSeconds = 60;
      if (retryAfter) {
        pauseDurationSeconds = parseInt(retryAfter, 10);
      } else if (isPrimaryRateLimit && this.rateLimitStatus.resetTimeEpoch) {
        const secondsUntilReset = Math.max(1, this.rateLimitStatus.resetTimeEpoch - Math.floor(Date.now() / 1000));
        pauseDurationSeconds = Math.min(secondsUntilReset, 3600);
      }

      this.rateLimitStatus.isThrottled = true;
      this.pauseUntilTimestamp = Date.now() + pauseDurationSeconds * 1000;

      const warningMsg = isSecondaryRateLimit
        ? "GitHub secondary rate limit triggered. Forensic scheduler is throttling requests."
        : "GitHub primary API rate limit reached. Analysis pausing temporarily.";

      if (this.onRateLimitWarning) {
        this.onRateLimitWarning(this.rateLimitStatus, warningMsg);
      }

      if (task.retries < this.maxRetries) {
        task.retries++;
        this.queue.unshift(task); // Re-queue at head
        return;
      } else {
        task.reject(
          new ForensicRateLimitError(
            warningMsg,
            this.rateLimitStatus.resetTimeIso,
            pauseDurationSeconds,
            isSecondaryRateLimit
          )
        );
        return;
      }
    }

    // Transient server errors (500, 502, 503, 504) -> Exponential Backoff + Jitter
    if (status && status >= 500 && status < 600 && task.retries < this.maxRetries) {
      task.retries++;
      const jitter = Math.random() * 200;
      const backoffMs = this.baseDelayMs * Math.pow(2, task.retries) + jitter;
      setTimeout(() => {
        this.queue.unshift(task);
        this.processQueue();
      }, backoffMs);
      return;
    }

    // Non-retryable error
    task.reject(
      new ForensicGitHubError(message, {
        statusCode: status,
      })
    );
  }

  public clearQueue(): void {
    while (this.queue.length > 0) {
      const task = this.queue.shift();
      if (task) {
        task.reject(new Error("Forensic analysis was cancelled."));
      }
    }
    this.inFlightPromises.clear();
  }
}
