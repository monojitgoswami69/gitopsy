import { describe, it, expect } from "vitest";
import { ForensicRequestScheduler } from "@/lib/github/scheduler";

describe("Forensic Request Scheduler", () => {
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
    expect(executionCount).toBe(1); // Executed only once
  });
});
