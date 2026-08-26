import { describe, it, expect } from "vitest";
import { detectDeterministicEasterEggs } from "@/lib/analytics/easterEggs";
import { ForensicCommit } from "@/types/domain";

describe("Case Notes & Special Findings Detector", () => {
  it("should unlock 404 commits case note when exact match occurs", () => {
    const eggs = detectDeterministicEasterEggs(
      {
        summary: {
          totalCommits: 404,
          totalContributions: 404,
          reposAnalyzed: 5,
          reposSkipped: 0,
          activeRepos: 3,
          linesAdded: 1000,
          linesDeleted: 200,
          netLines: 800,
          prsAuthored: 0,
          prsMerged: 0,
          mergeRatePercentage: null,
          issuesAuthored: 0,
          reviewsAuthored: 0,
          starsReceived: 0,
          forksReceived: 0,
          longestStreakDays: 1,
          activeStreakDays: 1,
          totalActiveDays: 10,
          longestInactiveGapDays: 0,
          peakDailyCommits: 5,
          averageDailyCommits: 2.5,
          multiContributorRepoShare: 0,
          functionalLanguageCount: 1,
          busiestHour: 12,
          busiestWeekday: "Monday",
          busiestMonth: "2026-01",
          nightCommitPercentage: 0,
          weekendCommitPercentage: 0,
        },
      },
      []
    );

    const egg404 = eggs.find((e) => e.id === "egg-404");
    expect(egg404).toBeDefined();
    expect(egg404?.title).toContain("404 COMMITS RECORDED");
  });

  it("should unlock Witching Hour when multiple 3 AM UTC commits exist", () => {
    const mock3amCommits: ForensicCommit[] = [
      {
        sha: "a1",
        repoFullName: "test/repo",
        authorLogin: "user",
        authorDate: "2026-08-01T03:15:00Z",
        message: "late work",
        additions: 10,
        deletions: 2,
        filesChanged: 1,
        isMerge: false,
        isRevert: false,
        hour: 3,
        weekday: 6,
        month: "2026-08",
        hasDetails: true,
      },
      {
        sha: "a2",
        repoFullName: "test/repo",
        authorLogin: "user",
        authorDate: "2026-08-02T03:45:00Z",
        message: "more late work",
        additions: 10,
        deletions: 2,
        filesChanged: 1,
        isMerge: false,
        isRevert: false,
        hour: 3,
        weekday: 0,
        month: "2026-08",
        hasDetails: true,
      },
      {
        sha: "a3",
        repoFullName: "test/repo",
        authorLogin: "user",
        authorDate: "2026-08-03T03:50:00Z",
        message: "even more late work",
        additions: 10,
        deletions: 2,
        filesChanged: 1,
        isMerge: false,
        isRevert: false,
        hour: 3,
        weekday: 1,
        month: "2026-08",
        hasDetails: true,
      },
    ];

    const eggs = detectDeterministicEasterEggs(
      { summary: { timezone: "UTC", timezoneAbbr: "UTC" } as any },
      mock3amCommits
    );
    const egg3am = eggs.find((e) => e.id === "egg-3am");
    expect(egg3am).toBeDefined();
    expect(egg3am?.title).toContain("03:00 UTC WITCHING HOUR");
  });
});
