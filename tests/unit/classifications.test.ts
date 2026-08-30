import { describe, it, expect } from "vitest";
import { computeDeveloperClassifications } from "@/lib/analytics/classifications";
import { ForensicCommit, RepositoryAnalysis } from "@/types/domain";

describe("Developer Assessments Engine", () => {
  const baseRepo: RepositoryAnalysis = {
    id: 1,
    name: "test-repo",
    fullName: "user/test-repo",
    isPrivate: false,
    isFork: false,
    isArchived: false,
    defaultBranch: "main",
    stars: 10,
    forks: 2,
    openIssues: 0,
    createdAt: "2023-01-01T00:00:00Z",
    lastPushedAt: "2026-08-01T00:00:00Z",
    primaryLanguage: "TypeScript",
    languages: [{ name: "TypeScript", bytes: 10000, percentage: 100 }],
    commitCount: 50,
    additions: 1000,
    deletions: 200,
    netLines: 800,
    prsAuthored: 5,
    prsMerged: 5,
    issuesAuthored: 1,
    activitySpanDays: 200,
    daysSinceLastPush: 5,
    fetchStatus: "ok",
    fetchWarnings: [],
  };

  it("should assess NIGHT OWL when late night percentage exceeds threshold and sample is sufficient", () => {
    const classifications = computeDeveloperClassifications({
      commits: [],
      repositories: [baseRepo],
      temporal: {
        heatmapCalendar: [],
        byHour: new Array(24).fill(2),
        byWeekday: new Array(7).fill(5),
        byMonth: [],
        longestInactiveGapDays: 2,
        peakDailyCommits: 5,
      },
      summary: {
        totalCommits: 50,
        totalActiveDays: 20,
        longestStreakDays: 12,
        nightCommitPercentage: 58, // > 35% threshold
        weekendCommitPercentage: 10,
        busiestHour: 2,
        busiestWeekday: "Thursday",
      },
      churn: {
        churnRatio: 0.16,
        totalDeletions: 200,
        totalAdditions: 1000,
      },
      commitForensics: {
        medianCommitSize: 20,
        averageMessageLength: 25,
        shortMessageCount: 2,
        longMessageCount: 5,
        conventionalCommitCount: 40,
        detailedCommitsCount: 30,
      },
      languages: [{ name: "TypeScript", bytes: 10000, percentage: 100, isFunctional: true }],
      commitCategories: [
        { category: "FEAT", count: 30, percentage: 60 },
        { category: "FIX", count: 10, percentage: 20 },
      ],
    });

    const nightOwl = classifications.find((c) => c.id === "night-owl");
    expect(nightOwl).toBeDefined();
    expect(nightOwl?.evidence.every((e) => e.isSatisfied)).toBe(true);
    expect(nightOwl?.evidenceStrength).toBe("VERY HIGH");
  });

  it("should assess ATOMIC COMMITTER when median commit size is <= 35 lines", () => {
    const classifications = computeDeveloperClassifications({
      commits: [],
      repositories: [baseRepo],
      temporal: {
        heatmapCalendar: [],
        byHour: new Array(24).fill(2),
        byWeekday: new Array(7).fill(5),
        byMonth: [],
        longestInactiveGapDays: 0,
        peakDailyCommits: 3,
      },
      summary: {
        totalCommits: 40,
        totalActiveDays: 15,
        longestStreakDays: 5,
        nightCommitPercentage: 10,
        weekendCommitPercentage: 15,
        busiestHour: 14,
        busiestWeekday: "Tuesday",
      },
      churn: {
        churnRatio: 0.2,
        totalDeletions: 100,
        totalAdditions: 400,
      },
      commitForensics: {
        medianCommitSize: 18,
        averageMessageLength: 30,
        shortMessageCount: 0,
        longMessageCount: 2,
        conventionalCommitCount: 35,
        detailedCommitsCount: 25,
      },
      languages: [{ name: "TypeScript", bytes: 10000, percentage: 100, isFunctional: true }],
      commitCategories: [{ category: "FEAT", count: 40, percentage: 100 }],
    });

    const atomic = classifications.find((c) => c.id === "atomic-committer");
    expect(atomic).toBeDefined();
    expect(atomic?.evidence.every((e) => e.isSatisfied)).toBe(true);
  });

  it("should assess SOLO OPERATOR and ARTISANAL BUILDER when criteria are met", () => {
    const soloRepo: RepositoryAnalysis = {
      ...baseRepo,
      stars: 0,
      forks: 0,
    };
    const classifications = computeDeveloperClassifications({
      commits: [],
      repositories: [soloRepo],
      temporal: {
        heatmapCalendar: [],
        byHour: new Array(24).fill(3),
        byWeekday: new Array(7).fill(10),
        byMonth: [],
        longestInactiveGapDays: 0,
        peakDailyCommits: 5,
      },
      summary: {
        totalCommits: 70,
        totalActiveDays: 30,
        longestStreakDays: 8,
        nightCommitPercentage: 10,
        weekendCommitPercentage: 10,
        busiestHour: 15,
        busiestWeekday: "Wednesday",
        prsAuthored: 0,
        reviewsAuthored: 0,
      } as any,
      churn: {
        churnRatio: 0.2,
        totalDeletions: 200,
        totalAdditions: 800,
      },
      commitForensics: {
        medianCommitSize: 25,
        averageMessageLength: 20,
        shortMessageCount: 1,
        longMessageCount: 1,
        conventionalCommitCount: 50,
        detailedCommitsCount: 40,
      },
      languages: [{ name: "TypeScript", bytes: 10000, percentage: 100, isFunctional: true }],
      commitCategories: [{ category: "FEAT", count: 70, percentage: 100 }],
    });

    const soloOp = classifications.find((c) => c.id === "solo-operator");
    expect(soloOp).toBeDefined();
    expect(soloOp?.evidence.every((e) => e.isSatisfied)).toBe(true);

    const artisanal = classifications.find((c) => c.id === "artisanal-builder");
    expect(artisanal).toBeDefined();
    expect(artisanal?.evidence.every((e) => e.isSatisfied)).toBe(true);
  });
});
