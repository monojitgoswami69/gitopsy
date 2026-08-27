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

describe("Temporal Analytics — Weekly Churn Synchronization", () => {
  const WEEK_START_SUNDAY =
    Math.floor(new Date("2026-07-05T00:00:00Z").getTime() / 1000); // Sunday

  it("should ACCUMULATE churn from multiple repos contributing in the same week (no last-writer-wins)", () => {
    // One commit on Wednesday of that week
    const commits = [makeCommit("2026-07-08T12:00:00Z", "sha-wed")];
    // Two different repos report weekly stats for the SAME week
    const weeklyStats = [
      { w: WEEK_START_SUNDAY, a: 100, d: 0, c: 5 },
      { w: WEEK_START_SUNDAY, a: 100, d: 50, c: 5 },
    ];

    const result = calculateTemporalAnalytics(commits, weeklyStats, "UTC");

    // The single active day receives BOTH repos' churn proportionally
    const day = result.heatmapCalendar.find((d) => d.date === "2026-07-08");
    expect(day).toBeDefined();
    expect(day!.additions).toBe(200);
    expect(day!.deletions).toBe(50);

    const july = result.commitsByMonth.find((m) => m.month === "2026-07");
    expect(july?.additions).toBe(200);
    expect(july?.deletions).toBe(50);
  });

  it("should attribute weekly churn to the months its days actually fall in (boundary weeks)", () => {
    // Week runs Sun 2026-08-30 .. Sat 2026-09-05; put one commit at the end
    // of August and one at the start of September.
    const commits = [
      makeCommit("2026-08-31T12:00:00Z", "sha-aug"),
      makeCommit("2026-09-01T12:00:00Z", "sha-sep"),
    ];
    const augustSundayWeek =
      Math.floor(new Date("2026-08-30T00:00:00Z").getTime() / 1000);
    const weeklyStats = [{ w: augustSundayWeek, a: 200, d: 100, c: 2 }];

    const result = calculateTemporalAnalytics(commits, weeklyStats, "UTC");

    const august = result.commitsByMonth.find((m) => m.month === "2026-08");
    const september = result.commitsByMonth.find((m) => m.month === "2026-09");

    // Equal-volume days -> churn splits evenly across the month boundary
    expect(august?.additions).toBe(100);
    expect(september?.additions).toBe(100);
    expect(august?.deletions).toBe(50);
    expect(september?.deletions).toBe(50);
  });

  it("should never fabricate commit counts when syncing unsampled weeks", () => {
    // No commits at all during this week, yet GitHub reports churn: the old
    // implementation invented 7 phantom active days (count >= 1 each),
    // corrupting streaks and totalActiveDays.
    const commits = [makeCommit("2026-06-10T12:00:00Z", "sha-june")]; // different week entirely
    const weeklyStats = [{ w: WEEK_START_SUNDAY, a: 70, d: 35, c: 4 }];

    const result = calculateTemporalAnalytics(commits, weeklyStats, "UTC");

    // Only the genuinely committed date counts as an active day
    expect(result.totalActiveDays).toBe(1);
    expect(result.longestStreakDays).toBe(1);

    // Heatmap may carry synced line data, but never invented commit counts
    const fabricated = result.heatmapCalendar.filter(
      (d) => d.count > 0 && !d.date.startsWith("2026-06")
    );
    expect(fabricated).toHaveLength(0);
  });

  it("should keep day-level churn consistent when a repo has no contributor stats", () => {
    // One repo provides weeks, the other none: totals must equal ONLY the
    // provided weeks (previously untouched-by-sync commits kept their own
    // stale diff-derived numbers).
    const commits = [makeCommit("2026-07-08T12:00:00Z", "sha-wed")];
    const weeklyStats = [{ w: WEEK_START_SUNDAY, a: 300, d: 30, c: 9 }];

    const result = calculateTemporalAnalytics(commits, weeklyStats, "UTC");

    const day = result.heatmapCalendar.find((d) => d.date === "2026-07-08");
    expect(day!.additions).toBe(300);
    expect(day!.deletions).toBe(30);
  });
});
