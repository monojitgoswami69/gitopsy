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
  onRateLimitWarning?: (status: RateLimitStatus, message: string, isTerminal: boolean) => void;
  longPauseThresholdSeconds?: number;
  onLongPause?: (resetEpoch: number, resetIso: string, pauseSeconds: number) => void;
}

interface QueuedTask<T> {
  fn: () => Promise<T>;
  resolve: (value: T | PromiseLike<T>) => void;
  reject: (reason?: unknown) => void;
  retries: number;
  cacheKey?: string;
}

const INITIAL_RATE_LIMIT: RateLimitStatus = {
  limit: 5000,
  remaining: 5000,
  resetTimeEpoch: 0,
  resetTimeIso: new Date().toISOString(),
  isThrottled: false,
};

export class ForensicRequestScheduler {
  private maxConcurrency: number;
  private maxRetries: number;
  private baseDelayMs: number;
  private currentRunning: number = 0;
  private queue: QueuedTask<unknown>[] = [];
  private inFlightPromises = new Map<string, Promise<unknown>>();
  private rateLimitStatus: RateLimitStatus = { ...INITIAL_RATE_LIMIT };
  private isPaused: boolean = false;
  private pauseUntilTimestamp: number = 0;
  private pauseTimer: ReturnType<typeof setTimeout> | null = null;
  private onRateLimitWarning?: (status: RateLimitStatus, message: string, isTerminal: boolean) => void;
  private longPauseThresholdSeconds: number;
  private onLongPause?: (resetEpoch: number, resetIso: string, pauseSeconds: number) => void;

  constructor(options: SchedulerOptions = {}) {
    this.maxConcurrency = options.maxConcurrency ?? 4;
    this.maxRetries = options.maxRetries ?? 3;
    this.baseDelayMs = options.baseDelayMs ?? 800;
    this.onRateLimitWarning = options.onRateLimitWarning;
    this.longPauseThresholdSeconds = options.longPauseThresholdSeconds ?? 300;
    this.onLongPause = options.onLongPause;
  }

  public getRateLimitStatus(): RateLimitStatus {
    return { ...this.rateLimitStatus };
  }

  public schedule<T>(fn: () => Promise<T>, cacheKey?: string): Promise<T> {
    if (cacheKey) {
      const existing = this.inFlightPromises.get(cacheKey);
      if (existing) {
        return existing as Promise<T>;
      }
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
      const clear = () => {
        this.inFlightPromises.delete(cacheKey);
      };
      promise.then(clear, clear);
    }

    return promise;
  }

  private async processQueue(): Promise<void> {
    if (this.queue.length === 0) {
      return;
    }

    if (this.isPaused) {
      return;
    }

    if (this.currentRunning >= this.maxConcurrency) {
      return;
    }

    const now = Date.now();
    if (this.pauseUntilTimestamp > now) {
      this.isPaused = true;
      const waitMs = this.pauseUntilTimestamp - now;
      if (this.pauseTimer) clearTimeout(this.pauseTimer);
      this.pauseTimer = setTimeout(() => {
        this.pauseTimer = null;
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

    // Rate Limit Parsing — only from ERROR responses (403/429), never from
    // successful responses. No pre-emptive throttling.
    const remaining = headers["x-ratelimit-remaining"];
    const resetEpoch = headers["x-ratelimit-reset"];
    const retryAfter = headers["retry-after"];

    if (remaining !== undefined) {
      const parsed = parseInt(remaining, 10);
      if (!isNaN(parsed)) this.rateLimitStatus.remaining = parsed;
    }
    if (resetEpoch !== undefined) {
      const parsed = parseInt(resetEpoch, 10);
      if (!isNaN(parsed)) {
        this.rateLimitStatus.resetTimeEpoch = parsed;
        this.rateLimitStatus.resetTimeIso = new Date(parsed * 1000).toISOString();
      }
    }

    const isSecondaryRateLimit =
      status === 403 &&
      (message.toLowerCase().includes("secondary rate limit") ||
        message.toLowerCase().includes("abuse detection") ||
        message.toLowerCase().includes("please wait"));

    const isPrimaryRateLimit = status === 403 && this.rateLimitStatus.remaining === 0;

    if (isPrimaryRateLimit || isSecondaryRateLimit || status === 429) {
      let pauseDurationSeconds = 60;
      if (retryAfter !== undefined) {
        const parsed = parseInt(retryAfter, 10);
        if (!isNaN(parsed)) {
          pauseDurationSeconds = parsed;
        }
      } else if (isPrimaryRateLimit && this.rateLimitStatus.resetTimeEpoch) {
        const secondsUntilReset = Math.max(1, this.rateLimitStatus.resetTimeEpoch - Math.floor(Date.now() / 1000));
        pauseDurationSeconds = Math.min(secondsUntilReset, 3600);
      }

      this.rateLimitStatus.isThrottled = true;
      this.pauseUntilTimestamp = Date.now() + pauseDurationSeconds * 1000;

      // If the pause is too long (e.g. 1 hour for primary reset), don't block
      // the worker — reject all tasks with a resumable error so the worker
      // can save a checkpoint and let the user resume later.
      const isLongPause = pauseDurationSeconds >= this.longPauseThresholdSeconds;

      if (isLongPause) {
        const resumableMsg = isSecondaryRateLimit
          ? `GitHub secondary rate limit triggered. Resume after ${pauseDurationSeconds}s (reset at ${this.rateLimitStatus.resetTimeIso}).`
          : `GitHub primary rate limit exhausted. Resume after ${pauseDurationSeconds}s (reset at ${this.rateLimitStatus.resetTimeIso}).`;

        if (this.onRateLimitWarning) {
          this.onRateLimitWarning(this.rateLimitStatus, resumableMsg, true);
        }
        if (this.onLongPause) {
          this.onLongPause(
            this.rateLimitStatus.resetTimeEpoch,
            this.rateLimitStatus.resetTimeIso,
            pauseDurationSeconds
          );
        }

        // Reject this task with a resumable error
        task.reject(
          new ForensicRateLimitError(
            resumableMsg,
            this.rateLimitStatus.resetTimeIso,
            pauseDurationSeconds,
            isSecondaryRateLimit,
            true
          )
        );

        // Reject ALL remaining queued tasks so the worker unblocks everywhere
        while (this.queue.length > 0) {
          const queued = this.queue.shift();
          if (queued) {
            queued.reject(
              new ForensicRateLimitError(
                "Cancelled for checkpoint resume.",
                this.rateLimitStatus.resetTimeIso,
                pauseDurationSeconds,
                isSecondaryRateLimit,
                true
              )
            );
          }
        }

        this.rateLimitStatus.isThrottled = false;
        this.pauseUntilTimestamp = 0;
        this.isPaused = false;
        if (this.pauseTimer) {
          clearTimeout(this.pauseTimer);
          this.pauseTimer = null;
        }
        return;
      }

      // Short pause — retry with backoff
      const warningMsg = isSecondaryRateLimit
        ? "GitHub secondary rate limit triggered. Forensic scheduler is throttling requests."
        : "GitHub primary API rate limit reached. Analysis pausing temporarily.";

      const willRetry = task.retries < this.maxRetries;

      if (willRetry) {
        if (this.onRateLimitWarning) {
          this.onRateLimitWarning(this.rateLimitStatus, warningMsg, false);
        }

        task.retries++;
        this.queue.unshift(task);
        return;
      } else {
        const terminalMsg = isSecondaryRateLimit
          ? "GitHub secondary rate limit exhausted after maximum retries. Repository fetch aborted."
          : "GitHub primary API rate limit exhausted after maximum retries. Repository fetch aborted.";

        if (this.onRateLimitWarning) {
          this.onRateLimitWarning(this.rateLimitStatus, terminalMsg, true);
        }

        this.rateLimitStatus.isThrottled = false;
        this.pauseUntilTimestamp = 0;
        this.isPaused = false;
        if (this.pauseTimer) {
          clearTimeout(this.pauseTimer);
          this.pauseTimer = null;
        }

        task.reject(
          new ForensicRateLimitError(
            terminalMsg,
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
    // NOTE: currentRunning is intentionally NOT reset here. In-flight tasks
    // still decrement it in their finally blocks; zeroing it would let the
    // counter go negative and permanently raise effective concurrency.
    this.isPaused = false;
    this.pauseUntilTimestamp = 0;
    this.rateLimitStatus = { ...INITIAL_RATE_LIMIT };
    if (this.pauseTimer) {
      clearTimeout(this.pauseTimer);
      this.pauseTimer = null;
    }
    this.processQueue();
  }

  public reset(): void {
    this.clearQueue();
  }
}
