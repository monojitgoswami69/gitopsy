import { describe, it, expect } from "vitest";
import { generateRepositoryAwards } from "@/lib/analytics/awards";
import { RepositoryAnalysis } from "@/types/domain";

describe("Repository Awards Engine", () => {
  it("should assign THE WORKHORSE to the repository with highest commit count", () => {
    const repos: RepositoryAnalysis[] = [
      {
        id: 1,
        name: "flagship-engine",
        fullName: "user/flagship-engine",
        isPrivate: false,
        isFork: false,
        isArchived: false,
        defaultBranch: "main",
        stars: 100,
        forks: 20,
        openIssues: 2,
        createdAt: "2023-01-01T00:00:00Z",
        lastPushedAt: "2026-08-01T00:00:00Z",
        primaryLanguage: "TypeScript",
        languages: [],
        commitCount: 150,
        additions: 20000,
        deletions: 5000,
        netLines: 15000,
        prsAuthored: 10,
        prsMerged: 10,
        issuesAuthored: 2,
        activitySpanDays: 500,
        daysSinceLastPush: 5,
        fetchStatus: "ok",
        fetchWarnings: [],
      },
      {
        id: 2,
        name: "side-toy",
        fullName: "user/side-toy",
        isPrivate: false,
        isFork: false,
        isArchived: false,
        defaultBranch: "main",
        stars: 5,
        forks: 0,
        openIssues: 0,
        createdAt: "2024-01-01T00:00:00Z",
        lastPushedAt: "2026-08-10T00:00:00Z",
        primaryLanguage: "Rust",
        languages: [],
        commitCount: 10,
        additions: 500,
        deletions: 100,
        netLines: 400,
        prsAuthored: 1,
        prsMerged: 1,
        issuesAuthored: 0,
        activitySpanDays: 100,
        daysSinceLastPush: 10,
        fetchStatus: "ok",
        fetchWarnings: [],
      },
    ];

    const awards = generateRepositoryAwards(repos, 160);
    const workhorse = awards.find((a) => a.id === "award-workhorse");

    expect(workhorse).toBeDefined();
    expect(workhorse?.repoFullName).toBe("user/flagship-engine");
  });
});
