import { describe, it, expect } from "vitest";
import { computeDeveloperClassifications } from "@/lib/analytics/classifications";
import { ForensicCommit, RepositoryAnalysis } from "@/types/domain";

describe("Developer Classifications Engine", () => {
  it("should diagnose NIGHT OWL BUILDER when late night percentage exceeds threshold", () => {
    const mockCommits: ForensicCommit[] = [];
    const mockRepos: RepositoryAnalysis[] = [
      {
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
      },
    ];

    const classifications = computeDeveloperClassifications({
      commits: mockCommits,
      repositories: mockRepos,
      temporal: {
        heatmapCalendar: [],
        byHour: new Array(24).fill(2),
        byWeekday: new Array(7).fill(5),
        byMonth: [],
      },
      summary: {
        totalCommits: 50,
        nightCommitPercentage: 58, // > 35% threshold
        weekendCommitPercentage: 10,
        longestStreakDays: 12,
        busiestHour: 2,
        busiestWeekday: "Thursday",
      },
      churn: {
        churnRatio: 0.16,
        totalDeletions: 200,
        totalAdditions: 1000,
      },
      languageCount: 2,
      commitCategories: [
        { category: "FEAT", count: 30, percentage: 60 },
        { category: "FIX", count: 10, percentage: 20 },
      ],
    });

    const nightOwl = classifications.find((c) => c.id === "night-owl-builder");
    expect(nightOwl).toBeDefined();
    expect(nightOwl?.evidence[0].isSatisfied).toBe(true);
    expect(nightOwl?.evidenceStrength).toBe("VERY HIGH");
  });
});
