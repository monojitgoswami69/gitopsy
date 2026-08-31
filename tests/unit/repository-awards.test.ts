import { describe, it, expect } from "vitest";
import { generateRepositoryAwards } from "@/lib/analytics/awards";
import { RepositoryAnalysis } from "@/types/domain";

describe("Repository Awards Engine", () => {
  const baseRepo: RepositoryAnalysis = {
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
    languages: [{ name: "TypeScript", bytes: 50000, percentage: 100 }],
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
  };

  it("should assign THE WORKHORSE to the repository with highest commit count", () => {
    const repos: RepositoryAnalysis[] = [
      baseRepo,
      {
        ...baseRepo,
        id: 2,
        name: "side-toy",
        fullName: "user/side-toy",
        commitCount: 10,
        daysSinceLastPush: 10,
      },
    ];

    const awards = generateRepositoryAwards(repos, 160);
    const workhorse = awards.find((a) => a.id === "award-workhorse");

    expect(workhorse).toBeDefined();
    expect(workhorse?.repoFullName).toBe("user/flagship-engine");
  });

  it("should heavily score a 400-day Ghost Town over a 181-day Ghost Town", () => {
    const repos: RepositoryAnalysis[] = [
      {
        ...baseRepo,
        id: 1,
        name: "ancient-ghost",
        fullName: "user/ancient-ghost",
        commitCount: 20,
        daysSinceLastPush: 400, // 400 days inactive!
      },
      {
        ...baseRepo,
        id: 2,
        name: "barely-ghost",
        fullName: "user/barely-ghost",
        commitCount: 20,
        daysSinceLastPush: 181, // 181 days inactive
      },
    ];

    const awards = generateRepositoryAwards(repos, 40);
    const ghostAward = awards.find((a) => a.id === "award-ghost-town");
    expect(ghostAward).toBeDefined();
    // The 400-day ancient ghost must be selected over the 181-day one
    expect(ghostAward?.repoFullName).toBe("user/ancient-ghost");
  });

  it("should return empty list when no repositories qualify", () => {
    const repos: RepositoryAnalysis[] = [
      {
        ...baseRepo,
        id: 1,
        name: "tiny-repo",
        fullName: "user/tiny-repo",
        commitCount: 2,
        stars: 0,
        daysSinceLastPush: 100,
        languages: [],
        additions: 10,
        deletions: 2,
      },
    ];

    const awards = generateRepositoryAwards(repos, 2);
    expect(awards).toEqual([]);
  });

  it("should return exactly the qualifying count when fewer than 6 qualify", () => {
    const repos: RepositoryAnalysis[] = [
      {
        ...baseRepo,
        id: 1,
        name: "workhorse-repo",
        fullName: "user/workhorse-repo",
        commitCount: 20,
        stars: 0,
        daysSinceLastPush: 2,
        activitySpanDays: 20,
        additions: 100,
        deletions: 50,
      },
      {
        ...baseRepo,
        id: 2,
        name: "abandoned-repo",
        fullName: "user/abandoned-repo",
        commitCount: 6,
        stars: 0,
        daysSinceLastPush: 200,
        activitySpanDays: 10,
        additions: 10,
        deletions: 10,
      },
    ];

    const awards = generateRepositoryAwards(repos, 80);
    expect(awards.length).toBe(2);
    expect(awards.map((a) => a.id)).toEqual(["award-workhorse", "award-ghost-town"]);
  });

  it("should cap awards at 6 max and produce identical results regardless of candidate input order", () => {
    const repoList: RepositoryAnalysis[] = [
      {
        ...baseRepo,
        id: 1,
        name: "workhorse-repo",
        fullName: "user/workhorse-repo",
        commitCount: 200,
        daysSinceLastPush: 2,
      },
      {
        ...baseRepo,
        id: 2,
        name: "abandoned-repo",
        fullName: "user/abandoned-repo",
        commitCount: 15,
        daysSinceLastPush: 450,
      },
      {
        ...baseRepo,
        id: 3,
        name: "chaos-repo",
        fullName: "user/chaos-repo",
        commitCount: 5,
        additions: 50000,
        deletions: 10000,
        daysSinceLastPush: 10,
      },
      {
        ...baseRepo,
        id: 4,
        name: "sleeper-repo",
        fullName: "user/sleeper-repo",
        commitCount: 10,
        stars: 80,
        daysSinceLastPush: 5,
      },
      {
        ...baseRepo,
        id: 5,
        name: "revived-repo",
        fullName: "user/revived-repo",
        commitCount: 25,
        activitySpanDays: 500,
        daysSinceLastPush: 2,
      },
      {
        ...baseRepo,
        id: 6,
        name: "swiss-repo",
        fullName: "user/swiss-repo",
        commitCount: 30,
        languages: [
          { name: "TypeScript", bytes: 4000, percentage: 40 },
          { name: "Rust", bytes: 3000, percentage: 30 },
          { name: "Python", bytes: 3000, percentage: 30 },
        ],
        daysSinceLastPush: 5,
      },
      {
        ...baseRepo,
        id: 7,
        name: "eternal-repo",
        fullName: "user/eternal-repo",
        commitCount: 40,
        activitySpanDays: 800,
        daysSinceLastPush: 2,
        createdAt: "2020-01-01T00:00:00Z",
      },
    ];

    const awardsA = generateRepositoryAwards(repoList, 320);
    const awardsB = generateRepositoryAwards([...repoList].reverse(), 320);

    expect(awardsA.length).toBeLessThanOrEqual(6);
    expect(awardsB.length).toBeLessThanOrEqual(6);
    expect(awardsA.map((a) => a.id)).toEqual(awardsB.map((b) => b.id));
  });

  it("should prevent duplicate concentration awards by preferring MONOLITH over MAIN CHARACTER for the same repo", () => {
    const repos: RepositoryAnalysis[] = [
      {
        ...baseRepo,
        id: 1,
        name: "monolith-repo",
        fullName: "user/monolith-repo",
        commitCount: 80, // 80% concentration out of 100 commits
        daysSinceLastPush: 2,
        activitySpanDays: 50,
      },
      {
        ...baseRepo,
        id: 2,
        name: "small-repo",
        fullName: "user/small-repo",
        commitCount: 20,
        daysSinceLastPush: 5,
        activitySpanDays: 20,
      },
    ];

    const awards = generateRepositoryAwards(repos, 100);
    const hasMonolith = awards.some((a) => a.id === "award-monolith");
    const hasMainChar = awards.some((a) => a.id === "award-main-character");

    expect(hasMonolith).toBe(true);
    // Main Character must be suppressed for the same repo
    expect(hasMainChar).toBe(false);
  });
});
