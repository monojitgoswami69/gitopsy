import { describe, it, expect, vi } from "vitest";
import { ForensicRequestScheduler } from "@/lib/github/scheduler";

describe("Forensic Request Scheduler — Hardened Behavior", () => {
  it("should enforce max concurrency bounds", async () => {
    const scheduler = new ForensicRequestScheduler({ maxConcurrency: 2 });
    let concurrent = 0;
    let maxObservedConcurrent = 0;

    const createMockTask = (id: number) => () =>
      new Promise<number>((resolve) => {
        concurrent++;
        maxObservedConcurrent = Math.max(maxObservedConcurrent, concurrent);
        setTimeout(() => {
          concurrent--;
          resolve(id);
        }, 30);
      });

    const promises = [
      scheduler.schedule(createMockTask(1)),
      scheduler.schedule(createMockTask(2)),
      scheduler.schedule(createMockTask(3)),
      scheduler.schedule(createMockTask(4)),
    ];

    const results = await Promise.all(promises);
    expect(results).toEqual([1, 2, 3, 4]);
    expect(maxObservedConcurrent).toBeLessThanOrEqual(2);
  });

  it("should deduplicate in-flight requests with identical cache keys", async () => {
    const scheduler = new ForensicRequestScheduler();
    let executionCount = 0;

    const task = () =>
      new Promise<string>((resolve) => {
        executionCount++;
        setTimeout(() => resolve("success"), 25);
      });

    const [r1, r2] = await Promise.all([
      scheduler.schedule(task, "CACHE_KEY_1"),
      scheduler.schedule(task, "CACHE_KEY_1"),
    ]);

    expect(r1).toBe("success");
    expect(r2).toBe("success");
    expect(executionCount).toBe(1);
  });

  it("should reset all state including pause on clearQueue", async () => {
    const scheduler = new ForensicRequestScheduler({ maxConcurrency: 1, maxRetries: 3 });
    const onRateLimitWarning = vi.fn();

    const errorTask = () =>
      new Promise<string>((_, reject) => {
        reject({
          status: 429,
          message: "Too many requests",
          headers: {
            "x-ratelimit-remaining": "0",
            "x-ratelimit-reset": String(Math.floor(Date.now() / 1000) + 60),
            "retry-after": "60",
          },
        });
      });

    const promise = scheduler.schedule(errorTask, "task1");

    await new Promise((r) => setTimeout(r, 50));

    scheduler.clearQueue();

    await expect(promise).rejects.toThrow();

    const status = scheduler.getRateLimitStatus();
    expect(status.remaining).toBe(5000);
    expect(status.isThrottled).toBe(false);

    const okTask = () =>
      new Promise<string>((resolve) => setTimeout(() => resolve("ok"), 10));
    const result = await scheduler.schedule(okTask, "task2");
    expect(result).toBe("ok");
  });

  it("should call onRateLimitWarning with isTerminal=true after exhausting retries", async () => {
    const onRateLimitWarning = vi.fn();
    const scheduler = new ForensicRequestScheduler({
      maxConcurrency: 1,
      maxRetries: 1,
      onRateLimitWarning,
    });

    const errorTask = () =>
      new Promise<string>((_, reject) => {
        reject({
          status: 429,
          message: "Too many requests",
          headers: {
            "x-ratelimit-remaining": "100",
            "retry-after": "0",
          },
        });
      });

    const promise = scheduler.schedule(errorTask, "task1");
    await expect(promise).rejects.toThrow();

    expect(onRateLimitWarning).toHaveBeenCalled();
    const lastCall = onRateLimitWarning.mock.calls[onRateLimitWarning.mock.calls.length - 1];
    expect(lastCall[2]).toBe(true);
  });

  it("should handle empty queue gracefully", () => {
    const scheduler = new ForensicRequestScheduler();
    expect(() => scheduler.clearQueue()).not.toThrow();
  });
});
