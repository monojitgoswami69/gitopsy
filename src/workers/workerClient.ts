import { WorkerInMessage, WorkerOutMessage, GitopsyAnalysis } from "@/types/domain";

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
}) => void;

export class ForensicWorkerClient {
  private worker: Worker | null = null;

  public startAnalysis(
    options: {
      token: string;
      username?: string;
      sinceDate?: string;
    },
    callbacks: {
      onProgress?: ProgressCallback;
      onRateLimit?: RateLimitCallback;
      onWarning?: (warning: { message: string; code: string }) => void;
    }
  ): Promise<GitopsyAnalysis> {
    return new Promise((resolve, reject) => {
      this.terminate();

      try {
        this.worker = new Worker(new URL("./analyzer.worker.ts", import.meta.url), {
          type: "module",
        });
      } catch {
        // Fallback for environments where worker constructor needs relative path
        this.worker = new Worker(new URL("./analyzer.worker.ts", import.meta.url));
      }

      this.worker.onmessage = (event: MessageEvent<WorkerOutMessage>) => {
        const msg = event.data;
        switch (msg.type) {
          case "PROGRESS":
            callbacks.onProgress?.(msg.payload);
            break;
          case "RATE_LIMIT":
            callbacks.onRateLimit?.(msg.payload);
            break;
          case "WARNING":
            callbacks.onWarning?.(msg.payload);
            break;
          case "COMPLETE":
            resolve(msg.payload.report);
            this.terminate();
            break;
          case "ERROR":
            reject(new Error(msg.payload.error));
            this.terminate();
            break;
        }
      };

      this.worker.onerror = (err) => {
        reject(err);
        this.terminate();
      };

      if (!options.token) {
        reject(new Error("A valid GitHub authentication token is required for analysis."));
        return;
      }

      this.worker.postMessage({
        type: "START_ANALYSIS",
        payload: {
          token: options.token,
          username: options.username,
          sinceDate: options.sinceDate,
        },
      } satisfies WorkerInMessage);
    });
  }

  public terminate(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
  }
}
