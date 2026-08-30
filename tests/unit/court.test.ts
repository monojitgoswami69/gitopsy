import { describe, it, expect } from "vitest";
import { generateCourtCharges } from "@/lib/analytics/court";

describe("Gitopsy Courtroom Charges Engine", () => {
  it("should charge Nocturnal Malpractice when night percentage >= 35% and sample >= 20", () => {
    const charges = generateCourtCharges(
      {
        summary: {
          totalCommits: 50,
          totalContributions: 50,
          reposAnalyzed: 2,
          reposSkipped: 0,
          activeRepos: 2,
          linesAdded: 1000,
          linesDeleted: 100,
          netLines: 900,
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
          averageDailyCommits: 2,
          multiContributorRepoShare: 0,
          functionalLanguageCount: 1,
          busiestHour: 2,
          busiestWeekday: "Friday",
          busiestMonth: "2026-08",
          nightCommitPercentage: 45,
          weekendCommitPercentage: 10,
        },
      },
      "testuser"
    );

    const nightCharge = charges.find((c) => c.id === "charge-night");
    expect(nightCharge).toBeDefined();
    expect(nightCharge?.verdict).toBe("GUILTY AS CHARGED");
  });

  it("should acquit on clean discipline when no violations are detected", () => {
    const charges = generateCourtCharges(
      {
        summary: {
          totalCommits: 50,
          totalContributions: 50,
          reposAnalyzed: 2,
          reposSkipped: 0,
          activeRepos: 2,
          linesAdded: 500,
          linesDeleted: 100,
          netLines: 400,
          prsAuthored: 5,
          prsMerged: 5,
          mergeRatePercentage: 100,
          issuesAuthored: 0,
          reviewsAuthored: 0,
          starsReceived: 0,
          forksReceived: 0,
          longestStreakDays: 5,
          activeStreakDays: 2,
          totalActiveDays: 20,
          longestInactiveGapDays: 2,
          peakDailyCommits: 4,
          averageDailyCommits: 2.5,
          multiContributorRepoShare: 50,
          functionalLanguageCount: 1,
          busiestHour: 14,
          busiestWeekday: "Wednesday",
          busiestMonth: "2026-08",
          nightCommitPercentage: 10,
          weekendCommitPercentage: 15,
        },
      },
      "modelcitizen"
    );

    expect(charges.length).toBe(1);
    expect(charges[0].verdict).toBe("ACQUITTED ON TECHNICALITY");
  });

  it("should charge False Declarations of Finality when final final commits >= 2", () => {
    const charges = generateCourtCharges(
      {
        summary: {
          totalCommits: 30,
          totalContributions: 30,
          reposAnalyzed: 1,
          reposSkipped: 0,
          activeRepos: 1,
          linesAdded: 200,
          linesDeleted: 50,
          netLines: 150,
          prsAuthored: 0,
          prsMerged: 0,
          mergeRatePercentage: null,
          issuesAuthored: 0,
          reviewsAuthored: 0,
          starsReceived: 0,
          forksReceived: 0,
          longestStreakDays: 2,
          activeStreakDays: 1,
          totalActiveDays: 5,
          longestInactiveGapDays: 1,
          peakDailyCommits: 5,
          averageDailyCommits: 2,
          multiContributorRepoShare: 0,
          functionalLanguageCount: 1,
          busiestHour: 14,
          busiestWeekday: "Tuesday",
          busiestMonth: "2026-08",
          nightCommitPercentage: 10,
          weekendCommitPercentage: 10,
        },
      },
      "finaluser",
      [
        {
          sha: "abc1",
          authorLogin: "finaluser",
          message: "fix styles final final",
          authorDate: "2026-08-01T12:00:00Z",
          repoFullName: "test/repo",
          additions: 10,
          deletions: 2,
          filesChanged: 1,
          hour: 12,
          weekday: 6,
          month: "2026-08",
          isMerge: false,
          isRevert: false,
          hasDetails: true,
        },
        {
          sha: "abc2",
          authorLogin: "finaluser",
          message: "really final bugfix",
          authorDate: "2026-08-02T12:00:00Z",
          repoFullName: "test/repo",
          additions: 5,
          deletions: 1,
          filesChanged: 1,
          hour: 12,
          weekday: 0,
          month: "2026-08",
          isMerge: false,
          isRevert: false,
          hasDetails: true,
        },
      ]
    );

    const finalityCharge = charges.find((c) => c.id === "charge-false-finality");
    expect(finalityCharge).toBeDefined();
    expect(finalityCharge?.verdict).toBe("GUILTY AS CHARGED");
  });
});
