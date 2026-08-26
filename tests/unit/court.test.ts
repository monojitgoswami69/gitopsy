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
});
