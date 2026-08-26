import { WorkerInMessage, WorkerOutMessage, GitopsyAnalysis, AnalysisCheckpoint } from "@/types/domain";

export type ProgressCallback = (progress: {
  phase: string;
  currentItem: string;
  current: number;
  total: number;
  percentage: number;
  message: string;
  rateLimitRemaining?: number;
}) => void;

export type RateLimitCallback = (rateLimit: {
  resetAt: string;
  waitSeconds: number;
  message: string;
  isTerminal: boolean;
}) => void;

export type RepoWarningCallback = (warning: {
  repoFullName: string;
  phase: string;
  error: string;
}) => void;

export type WarningCallback = (warning: { message: string; code: string }) => void;

export type LogCallback = (log: { level: "info" | "warn" | "error"; message: string }) => void;

export type ResumeAvailableCallback = (resume: {
  checkpointId: string;
  resumeAt: string;
  resumeReason: string;
  resetEpoch: number;
}) => void;

export type CheckpointSavedCallback = (checkpoint: {
  checkpointId: string;
  reposProcessed: number;
  reposTotal: number;
}) => void;

export interface AnalysisCallbacks {
  onProgress?: ProgressCallback;
  onRateLimit?: RateLimitCallback;
  onRepoWarning?: RepoWarningCallback;
  onWarning?: WarningCallback;
  onLog?: LogCallback;
  onResumeAvailable?: ResumeAvailableCallback;
  onCheckpointSaved?: CheckpointSavedCallback;
}

const TERMINATION_ERROR = "Forensic analysis was cancelled before completion.";

export class ForensicWorkerClient {
  private worker: Worker | null = null;
  private activeReject: ((error: Error) => void) | null = null;
  private isCancelled: boolean = false;

  public startAnalysis(
    options: {
      token: string;
      username?: string;
      sinceDate?: string;
      isIncremental?: boolean;
      maxConcurrency?: number;
      timezone?: string;
    },
    callbacks: AnalysisCallbacks = {}
  ): Promise<GitopsyAnalysis> {
    if (!options.token || options.token.trim().length === 0) {
      return Promise.reject(
        new Error("A valid GitHub authentication token is required for analysis.")
      );
    }

    if (this.worker || this.activeReject) {
      this.cancel(TERMINATION_ERROR);
    }

    this.isCancelled = false;

    const detectedTimezone =
      options.timezone ||
      (typeof Intl !== "undefined" && Intl.DateTimeFormat
        ? Intl.DateTimeFormat().resolvedOptions().timeZone
        : "UTC") ||
      "UTC";

    return new Promise<GitopsyAnalysis>((resolve, reject) => {
      this.activeReject = reject;

      let worker: Worker;
      try {
        worker = new Worker(new URL("./analyzer.worker.ts", import.meta.url), {
          type: "module",
        });
      } catch (constructErr) {
        try {
          worker = new Worker(new URL("./analyzer.worker.ts", import.meta.url));
        } catch (fallbackErr) {
          const message =
            constructErr instanceof Error ? constructErr.message : String(constructErr);
          reject(
            new Error(
              `Failed to spawn forensic analyzer worker: ${message}. Worker module may be unavailable.`
            )
          );
          this.activeReject = null;
          return;
        }
      }
      this.worker = worker;

      const handleMessage = (event: MessageEvent<WorkerOutMessage>) => {
        if (this.isCancelled) return;
        const msg = event.data;
        switch (msg.type) {
          case "PROGRESS":
            callbacks.onProgress?.(msg.payload);
            break;
          case "RATE_LIMIT":
            callbacks.onRateLimit?.(msg.payload);
            break;
          case "REPO_WARNING":
            callbacks.onRepoWarning?.(msg.payload);
            break;
          case "WARNING":
            callbacks.onWarning?.(msg.payload);
            break;
          case "LOG":
            callbacks.onLog?.(msg.payload);
            break;
          case "CHECKPOINT_SAVED":
            callbacks.onCheckpointSaved?.(msg.payload);
            break;
          case "RESUME_AVAILABLE":
            callbacks.onResumeAvailable?.(msg.payload);
            this.cleanup();
            resolve(null as unknown as GitopsyAnalysis);
            break;
          case "COMPLETE":
            resolve(msg.payload.report);
            this.cleanup();
            break;
          case "CANCELLED":
            reject(new Error(TERMINATION_ERROR));
            this.cleanup();
            break;
          case "ERROR":
            reject(new Error(msg.payload.error));
            this.cleanup();
            break;
        }
      };

      const handleError = (err: ErrorEvent) => {
        if (this.isCancelled) return;
        const detail = err.message || "unknown worker error";
        reject(
          new Error(
            `Forensic analyzer worker crashed: ${detail}. ` +
              `File: ${err.filename || "unknown"}:${err.lineno || 0}:${err.colno || 0}.`
          )
        );
        this.cleanup();
      };

      const handleMessageError = (event: MessageEvent) => {
        if (this.isCancelled) return;
        const detail = typeof event.data === "string" ? event.data : "unserializable message";
        reject(
          new Error(`Forensic analyzer worker received a malformed message: ${detail}.`)
        );
        this.cleanup();
      };

      this.worker.onmessage = handleMessage;
      this.worker.onerror = handleError;
      this.worker.onmessageerror = handleMessageError;

      const payload: WorkerInMessage = {
        type: "START_ANALYSIS",
        payload: {
          token: options.token,
          username: options.username,
          sinceDate: options.sinceDate,
          isIncremental: options.isIncremental,
          maxConcurrency: options.maxConcurrency,
          timezone: detectedTimezone,
        },
      };
      this.worker.postMessage(payload);
    });
  }

  public resumeAnalysis(
    options: {
      token: string;
      checkpoint: AnalysisCheckpoint;
      maxConcurrency?: number;
      timezone?: string;
    },
    callbacks: AnalysisCallbacks = {}
  ): Promise<GitopsyAnalysis> {
    if (!options.token || options.token.trim().length === 0) {
      return Promise.reject(
        new Error("A valid GitHub authentication token is required to resume analysis.")
      );
    }

    if (this.worker || this.activeReject) {
      this.cancel(TERMINATION_ERROR);
    }

    this.isCancelled = false;

    const detectedTimezone =
      options.timezone ||
      options.checkpoint.timezone ||
      (typeof Intl !== "undefined" && Intl.DateTimeFormat
        ? Intl.DateTimeFormat().resolvedOptions().timeZone
        : "UTC") ||
      "UTC";

    return new Promise<GitopsyAnalysis>((resolve, reject) => {
      this.activeReject = reject;

      let worker: Worker;
      try {
        worker = new Worker(new URL("./analyzer.worker.ts", import.meta.url), {
          type: "module",
        });
      } catch (constructErr) {
        try {
          worker = new Worker(new URL("./analyzer.worker.ts", import.meta.url));
        } catch {
          const message =
            constructErr instanceof Error ? constructErr.message : String(constructErr);
          reject(new Error(`Failed to spawn forensic analyzer worker: ${message}.`));
          this.activeReject = null;
          return;
        }
      }
      this.worker = worker;

      const handleMessage = (event: MessageEvent<WorkerOutMessage>) => {
        if (this.isCancelled) return;
        const msg = event.data;
        switch (msg.type) {
          case "PROGRESS":
            callbacks.onProgress?.(msg.payload);
            break;
          case "RATE_LIMIT":
            callbacks.onRateLimit?.(msg.payload);
            break;
          case "REPO_WARNING":
            callbacks.onRepoWarning?.(msg.payload);
            break;
          case "WARNING":
            callbacks.onWarning?.(msg.payload);
            break;
          case "LOG":
            callbacks.onLog?.(msg.payload);
            break;
          case "CHECKPOINT_SAVED":
            callbacks.onCheckpointSaved?.(msg.payload);
            break;
          case "RESUME_AVAILABLE":
            callbacks.onResumeAvailable?.(msg.payload);
            this.cleanup();
            resolve(null as unknown as GitopsyAnalysis);
            break;
          case "COMPLETE":
            resolve(msg.payload.report);
            this.cleanup();
            break;
          case "CANCELLED":
            reject(new Error(TERMINATION_ERROR));
            this.cleanup();
            break;
          case "ERROR":
            reject(new Error(msg.payload.error));
            this.cleanup();
            break;
        }
      };

      const handleError = (err: ErrorEvent) => {
        if (this.isCancelled) return;
        const detail = err.message || "unknown worker error";
        reject(
          new Error(
            `Forensic analyzer worker crashed: ${detail}. ` +
              `File: ${err.filename || "unknown"}:${err.lineno || 0}:${err.colno || 0}.`
          )
        );
        this.cleanup();
      };

      const handleMessageError = (event: MessageEvent) => {
        if (this.isCancelled) return;
        const detail = typeof event.data === "string" ? event.data : "unserializable message";
        reject(new Error(`Forensic analyzer worker received a malformed message: ${detail}.`));
        this.cleanup();
      };

      this.worker.onmessage = handleMessage;
      this.worker.onerror = handleError;
      this.worker.onmessageerror = handleMessageError;

      const payload: WorkerInMessage = {
        type: "RESUME",
        payload: {
          token: options.token,
          checkpoint: options.checkpoint,
          maxConcurrency: options.maxConcurrency,
          timezone: detectedTimezone,
        },
      };
      this.worker.postMessage(payload);
    });
  }

  public cancel(reason: string = TERMINATION_ERROR): void {
    this.isCancelled = true;
    if (this.worker) {
      try {
        this.worker.postMessage({ type: "CANCEL" } satisfies WorkerInMessage);
      } catch {
        // worker may not be ready
      }
      this.worker.terminate();
      this.worker = null;
    }
    if (this.activeReject) {
      this.activeReject(new Error(reason));
      this.activeReject = null;
    }
  }

  public terminate(): void {
    this.cancel(TERMINATION_ERROR);
  }

  private cleanup(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.activeReject = null;
    this.isCancelled = false;
  }
}
