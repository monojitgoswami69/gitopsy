import { describe, it, expect } from "vitest";
import { generateDeterministicFindings } from "@/lib/analytics/funFacts";

describe("Deterministic Findings Engine", () => {
  it("should generate hiatus and density findings when conditions are met", () => {
    const findings = generateDeterministicFindings({
      summary: {
        totalCommits: 100,
        totalContributions: 100,
        reposAnalyzed: 5,
        reposSkipped: 0,
        activeRepos: 4,
        linesAdded: 5000,
        linesDeleted: 2000,
        netLines: 3000,
        prsAuthored: 10,
        prsMerged: 10,
        mergeRatePercentage: 100,
        issuesAuthored: 2,
        reviewsAuthored: 5,
        starsReceived: 50,
        forksReceived: 10,
        longestStreakDays: 14,
        activeStreakDays: 3,
        totalActiveDays: 25,
        longestInactiveGapDays: 45,
        peakDailyCommits: 12,
        averageDailyCommits: 4.0,
        multiContributorRepoShare: 40,
        functionalLanguageCount: 3,
        busiestHour: 15,
        busiestWeekday: "Tuesday",
        busiestMonth: "2026-05",
        nightCommitPercentage: 20,
        weekendCommitPercentage: 20,
      },
    });

    const hiatus = findings.find((f) => f.id === "finding-hiatus");
    expect(hiatus).toBeDefined();
    expect(hiatus?.evidence).toContain("45 days");

    const density = findings.find((f) => f.id === "finding-density");
    expect(density).toBeDefined();
    expect(density?.evidence).toContain("25 distinct active calendar days");

    const mergeRate = findings.find((f) => f.id === "finding-merge-rate");
    expect(mergeRate).toBeDefined();
    expect(mergeRate?.evidence).toContain("10 of 10 pull requests were merged");
  });
});
