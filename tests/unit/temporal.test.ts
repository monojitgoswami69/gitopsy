import { describe, it, expect } from "vitest";
import { calculateTemporalAnalytics } from "@/lib/analytics/temporal";
import { ForensicCommit } from "@/types/domain";

function makeCommit(dateStr: string, sha?: string): ForensicCommit {
  const d = new Date(dateStr);
  return {
    sha: sha || dateStr,
    repoFullName: "test/repo",
    authorLogin: "test",
    authorDate: dateStr,
    message: "test commit",
    additions: 10,
    deletions: 5,
    filesChanged: 1,
    isMerge: false,
    isRevert: false,
    hour: d.getUTCHours(),
    weekday: d.getUTCDay(),
    month: `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`,
    hasDetails: true,
  };
}

describe("Temporal Analytics — Hardened Behavior & Timezone Handling", () => {
  it("should count night commits in the 21:00-04:59 UTC window when targetTimezone is UTC", () => {
    const commits: ForensicCommit[] = [
      makeCommit("2026-01-01T22:00:00Z", "sha1"),
      makeCommit("2026-01-01T03:00:00Z", "sha2"),
      makeCommit("2026-01-01T12:00:00Z", "sha3"),
      makeCommit("2026-01-01T05:00:00Z", "sha4"),
    ];

    const result = calculateTemporalAnalytics(commits, undefined, "UTC");

    // 2 of 4 commits are night (22:00 and 03:00 UTC)
    expect(result.nightCommitPercentage).toBe(50);
    expect(result.timezone).toBe("UTC");
    expect(result.timezoneAbbr).toBe("UTC");
  });

  it("should accurately convert timestamps to Asia/Kolkata (IST)", () => {
    // In IST (+5:30):
    // 2026-01-01T17:30:00Z is 23:00 IST (Night)
    // 2026-01-01T22:00:00Z is 03:30 IST (Night)
    // 2026-01-01T06:30:00Z is 12:00 IST (Day)
    const commits: ForensicCommit[] = [
      makeCommit("2026-01-01T17:30:00Z", "sha1"),
      makeCommit("2026-01-01T22:00:00Z", "sha2"),
      makeCommit("2026-01-01T06:30:00Z", "sha3"),
    ];

    const result = calculateTemporalAnalytics(commits, undefined, "Asia/Kolkata");
    expect(result.nightCommitPercentage).toBe(67);
    expect(result.timezone).toBe("Asia/Kolkata");
    expect(result.timezoneAbbr).toBe("IST");
    expect(result.commitsByHour[23]).toBe(1);
    expect(result.commitsByHour[3]).toBe(1);
    expect(result.commitsByHour[12]).toBe(1);
  });

  it("should include hour 4 (04:00-04:59) in night window in UTC", () => {
    const commits: ForensicCommit[] = [
      makeCommit("2026-01-01T04:30:00Z", "sha1"),
      makeCommit("2026-01-01T12:00:00Z", "sha2"),
    ];

    const result = calculateTemporalAnalytics(commits, undefined, "UTC");
    expect(result.nightCommitPercentage).toBe(50);
  });

  it("should exclude hour 5 (05:00) from night window in UTC", () => {
    const commits: ForensicCommit[] = [
      makeCommit("2026-01-01T05:00:00Z", "sha1"),
      makeCommit("2026-01-01T12:00:00Z", "sha2"),
    ];

    const result = calculateTemporalAnalytics(commits, undefined, "UTC");
    expect(result.nightCommitPercentage).toBe(0);
  });

  it("should calculate longest streak correctly", () => {
    const commits: ForensicCommit[] = [
      makeCommit("2026-01-01T10:00:00Z"),
      makeCommit("2026-01-02T10:00:00Z"),
      makeCommit("2026-01-03T10:00:00Z"),
      makeCommit("2026-01-05T10:00:00Z"),
    ];

    const result = calculateTemporalAnalytics(commits, undefined, "UTC");
    expect(result.longestStreakDays).toBe(3);
  });

  it("should set activeStreak to 0 when last commit is old", () => {
    const commits: ForensicCommit[] = [
      makeCommit("2026-01-01T10:00:00Z"),
      makeCommit("2026-01-02T10:00:00Z"),
    ];

    const result = calculateTemporalAnalytics(commits, undefined, "UTC");
    expect(result.activeStreakDays).toBe(0);
  });

  it("should handle empty commits", () => {
    const result = calculateTemporalAnalytics([], undefined, "UTC");
    expect(result.totalActiveDays).toBe(0);
    expect(result.longestStreakDays).toBe(0);
    expect(result.activeStreakDays).toBe(0);
    expect(result.nightCommitPercentage).toBe(0);
    expect(result.commitsByHour.length).toBe(24);
    expect(result.commitsByWeekday.length).toBe(7);
  });

  it("should count weekend commits (Saturday and Sunday)", () => {
    // 2026-01-03 is Saturday, 2026-01-04 is Sunday in UTC
    const commits: ForensicCommit[] = [
      makeCommit("2026-01-03T10:00:00Z"),
      makeCommit("2026-01-04T10:00:00Z"),
      makeCommit("2026-01-05T10:00:00Z"), // Monday
    ];

    const result = calculateTemporalAnalytics(commits, undefined, "UTC");
    expect(result.weekendCommitPercentage).toBe(67);
  });
});
