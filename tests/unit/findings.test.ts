import { describe, it, expect } from "vitest";
import { generateDeterministicFindings } from "@/lib/analytics/funFacts";

describe("Deterministic Findings Engine", () => {
  it("should generate hiatus, density, and merge findings when meaningful conditions are met", () => {
    const findings = generateDeterministicFindings({
      summary: {
        totalCommits: 100,
        totalContributions: 100,
        reposAnalyzed: 5,
        reposSkipped: 0,
        activeRepos: 4,
        linesAdded: 5000,
        linesDeleted: 1000,
        netLines: 4000,
        prsAuthored: 10,
        prsMerged: 10,
        mergeRatePercentage: 100,
        issuesAuthored: 2,
        reviewsAuthored: 5,
        starsReceived: 50,
        forksReceived: 10,
        longestStreakDays: 14,
        activeStreakDays: 3,
        totalActiveDays: 20,
        longestInactiveGapDays: 45,
        peakDailyCommits: 12,
        averageDailyCommits: 5.0,
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
    expect(hiatus?.evidence).toContain("45 calendar days");

    const density = findings.find((f) => f.id === "finding-density");
    expect(density).toBeDefined();
    expect(density?.evidence).toContain("20 distinct active calendar days");

    const mergeRate = findings.find((f) => f.id === "finding-merge-rate");
    expect(mergeRate).toBeDefined();
    expect(mergeRate?.evidence).toContain("10 of 10 pull requests were merged");
  });

  it("should filter out unremarkable average numbers to prevent noise", () => {
    const findings = generateDeterministicFindings({
      summary: {
        totalCommits: 5,
        totalContributions: 5,
        reposAnalyzed: 1,
        reposSkipped: 0,
        activeRepos: 1,
        linesAdded: 50,
        linesDeleted: 30, // ratio 1.6x is normal, lines < 100
        netLines: 20,
        prsAuthored: 1, // < 5 PRs
        prsMerged: 1,
        mergeRatePercentage: 100,
        issuesAuthored: 0,
        reviewsAuthored: 0,
        starsReceived: 0,
        forksReceived: 0,
        longestStreakDays: 1, // < 5 days
        activeStreakDays: 1,
        totalActiveDays: 4,
        longestInactiveGapDays: 3, // < 21 days
        peakDailyCommits: 2, // < 8 commits
        averageDailyCommits: 1.2, // < 3.5
        multiContributorRepoShare: 0,
        functionalLanguageCount: 1,
        busiestHour: 14,
        busiestWeekday: "Monday",
        busiestMonth: "2026-08",
        nightCommitPercentage: 0,
        weekendCommitPercentage: 0,
      },
    });

    // Unremarkable metrics shouldn't emit findings
    expect(findings.find((f) => f.id === "finding-hiatus")).toBeUndefined();
    expect(findings.find((f) => f.id === "finding-streak")).toBeUndefined();
    expect(findings.find((f) => f.id === "finding-merge-rate")).toBeUndefined();
    expect(findings.find((f) => f.id === "finding-density")).toBeUndefined();
  });
});
