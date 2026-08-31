import { describe, it, expect } from "vitest";
import { computeDeveloperClassifications } from "@/lib/analytics/classifications";
import { RepositoryAnalysis } from "@/types/domain";

describe("Developer Classifications Engine", () => {
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

  function createMockTemporal(hourMap: Record<number, number>, weekdayMap: Record<number, number> = {}) {
    const byHour = new Array(24).fill(0);
    for (const [h, count] of Object.entries(hourMap)) {
      byHour[Number(h)] = count;
    }
    const byWeekday = new Array(7).fill(0);
    for (const [w, count] of Object.entries(weekdayMap)) {
      byWeekday[Number(w)] = count;
    }
    return {
      heatmapCalendar: [],
      byHour,
      byWeekday,
      byMonth: [],
      longestInactiveGapDays: 0,
      peakDailyCommits: 5,
    };
  }

  it("should classify NIGHT SHIFT when >= 75% commits occur at night with sufficient sample", () => {
    // 30 commits all at 23:00 (night)
    const classifications = computeDeveloperClassifications({
      commits: [],
      repositories: [baseRepo],
      temporal: createMockTemporal({ 23: 30 }, { 1: 30 }),
      summary: {
        totalCommits: 30,
        totalActiveDays: 10,
        longestStreakDays: 3,
        nightCommitPercentage: 100,
        weekendCommitPercentage: 0,
        busiestHour: 23,
      },
      churn: { churnRatio: 0.2, totalDeletions: 100, totalAdditions: 400 },
      commitForensics: {
        medianCommitSize: 20,
        averageMessageLength: 25,
        shortMessageCount: 0,
        longMessageCount: 0,
        conventionalCommitCount: 0,
        detailedCommitsCount: 20,
      },
      languages: [{ name: "TypeScript", bytes: 10000, percentage: 100, isFunctional: true }],
      commitCategories: [],
    });

    const nightShift = classifications.find((c) => c.id === "night-shift");
    expect(nightShift).toBeDefined();
    expect(nightShift?.evidence.every((e) => e.isSatisfied)).toBe(true);

    const nightOwl = classifications.find((c) => c.id === "night-owl");
    // Night Shift should supersede Night Owl
    expect(nightOwl?.evidence.every((e) => e.isSatisfied)).toBe(false);
  });

  it("should classify NIGHT OWL when night activity is elevated and exceeds afternoon baseline", () => {
    // 40 commits total: 18 night (45%), 6 afternoon (15%), 16 morning (40%)
    const classifications = computeDeveloperClassifications({
      commits: [],
      repositories: [baseRepo],
      temporal: createMockTemporal({ 22: 18, 14: 6, 9: 16 }, { 1: 20, 2: 20 }),
      summary: {
        totalCommits: 40,
        totalActiveDays: 15,
        longestStreakDays: 4,
        nightCommitPercentage: 45,
        weekendCommitPercentage: 0,
        busiestHour: 22,
      },
      churn: { churnRatio: 0.2, totalDeletions: 100, totalAdditions: 400 },
      commitForensics: {
        medianCommitSize: 20,
        averageMessageLength: 25,
        shortMessageCount: 0,
        longMessageCount: 0,
        conventionalCommitCount: 0,
        detailedCommitsCount: 20,
      },
      languages: [{ name: "TypeScript", bytes: 10000, percentage: 100, isFunctional: true }],
      commitCategories: [],
    });

    const nightOwl = classifications.find((c) => c.id === "night-owl");
    expect(nightOwl).toBeDefined();
    expect(nightOwl?.evidence.every((e) => e.isSatisfied)).toBe(true);
  });

  it("should NOT classify NIGHT OWL for tiny sample sizes or balanced activity", () => {
    // Only 4 commits at night
    const classifications = computeDeveloperClassifications({
      commits: [],
      repositories: [baseRepo],
      temporal: createMockTemporal({ 23: 4 }),
      summary: {
        totalCommits: 4,
        totalActiveDays: 2,
        longestStreakDays: 1,
        nightCommitPercentage: 100,
        weekendCommitPercentage: 0,
        busiestHour: 23,
      },
      churn: { churnRatio: 0.2, totalDeletions: 10, totalAdditions: 40 },
      commitForensics: {
        medianCommitSize: 20,
        averageMessageLength: 25,
        shortMessageCount: 0,
        longMessageCount: 0,
        conventionalCommitCount: 0,
        detailedCommitsCount: 4,
      },
      languages: [{ name: "TypeScript", bytes: 10000, percentage: 100, isFunctional: true }],
      commitCategories: [],
    });

    const nightOwl = classifications.find((c) => c.id === "night-owl");
    expect(nightOwl?.evidence.every((e) => e.isSatisfied)).toBe(false);
  });

  it("should assess ATOMIC COMMITTER when median commit size is <= 35 lines", () => {
    const classifications = computeDeveloperClassifications({
      commits: [],
      repositories: [baseRepo],
      temporal: createMockTemporal({ 14: 40 }),
      summary: {
        totalCommits: 40,
        totalActiveDays: 15,
        longestStreakDays: 5,
        nightCommitPercentage: 10,
        weekendCommitPercentage: 15,
        busiestHour: 14,
      },
      churn: { churnRatio: 0.2, totalDeletions: 100, totalAdditions: 400 },
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

  it("should not contain removed weak rules artisanal-builder or solo-operator", () => {
    const classifications = computeDeveloperClassifications({
      commits: [],
      repositories: [{ ...baseRepo, stars: 0, forks: 0 }],
      temporal: createMockTemporal({ 12: 50 }),
      summary: {
        totalCommits: 50,
        totalActiveDays: 20,
        longestStreakDays: 5,
        nightCommitPercentage: 0,
        weekendCommitPercentage: 0,
        busiestHour: 12,
        prsAuthored: 0,
        reviewsAuthored: 0,
      },
      churn: { churnRatio: 0.2, totalDeletions: 100, totalAdditions: 400 },
      commitForensics: {
        medianCommitSize: 50,
        averageMessageLength: 25,
        shortMessageCount: 0,
        longMessageCount: 0,
        conventionalCommitCount: 0,
        detailedCommitsCount: 50,
      },
      languages: [],
      commitCategories: [],
    });

    expect(classifications.find((c) => c.id === "artisanal-builder")).toBeUndefined();
    expect(classifications.find((c) => c.id === "solo-operator")).toBeUndefined();
  });

  it("should NOT classify POLYGLOT when language data is empty", () => {
    const classifications = computeDeveloperClassifications({
      commits: [],
      repositories: [baseRepo],
      temporal: createMockTemporal({ 12: 50 }),
      summary: {
        totalCommits: 50,
        totalActiveDays: 20,
        longestStreakDays: 5,
        nightCommitPercentage: 0,
        weekendCommitPercentage: 0,
        busiestHour: 12,
      },
      churn: { churnRatio: 0.2, totalDeletions: 100, totalAdditions: 400 },
      commitForensics: {
        medianCommitSize: 50,
        averageMessageLength: 25,
        shortMessageCount: 0,
        longMessageCount: 0,
        conventionalCommitCount: 0,
        detailedCommitsCount: 50,
      },
      languages: [],
      commitCategories: [],
    });

    const polyglot = classifications.find((c) => c.id === "polyglot-investigator");
    expect(polyglot?.evidence.every((e) => e.isSatisfied)).toBe(false);
  });

  it("should remain resilient with 0 commits without NaN or crashing", () => {
    const classifications = computeDeveloperClassifications({
      commits: [],
      repositories: [],
      temporal: createMockTemporal({}),
      summary: {
        totalCommits: 0,
        totalActiveDays: 0,
        longestStreakDays: 0,
        nightCommitPercentage: 0,
        weekendCommitPercentage: 0,
        busiestHour: 0,
      },
      churn: { churnRatio: 0, totalDeletions: 0, totalAdditions: 0 },
      commitForensics: {
        medianCommitSize: 0,
        averageMessageLength: 0,
        shortMessageCount: 0,
        longMessageCount: 0,
        conventionalCommitCount: 0,
        detailedCommitsCount: 0,
      },
      languages: [],
      commitCategories: [],
    });

    expect(classifications).toBeDefined();
    expect(classifications.length).toBeGreaterThan(0);
    // None should be satisfied
    const satisfied = classifications.filter((c) => c.evidence.every((e) => e.isSatisfied));
    expect(satisfied.length).toBe(0);
  });
});
