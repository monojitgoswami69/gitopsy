import { describe, it, expect } from "vitest";
import { calculateCodeChurnAnalytics } from "@/lib/analytics/churn";
import { analyzeCommitForensics } from "@/lib/analytics/commitForensics";
import { ForensicCommit } from "@/types/domain";

function makeCommit(
  sha: string,
  additions: number,
  deletions: number,
  hasDetails = true
): ForensicCommit {
  return {
    sha,
    repoFullName: "test/repo",
    authorLogin: "test",
    authorDate: "2026-01-01T10:00:00Z",
    message: "test commit",
    additions,
    deletions,
    filesChanged: 1,
    isMerge: false,
    isRevert: false,
    hour: 10,
    weekday: 2,
    month: "2026-01",
    hasDetails,
  };
}

describe("Churn Analytics — Unified Ratio Formula", () => {
  it("should compute churnRatio as deletions / (additions + deletions)", () => {
    const commits = [
      makeCommit("sha1", 800, 200),
      makeCommit("sha2", 100, 100),
    ];

    const result = calculateCodeChurnAnalytics(commits);
    // totalAdditions=900, totalDeletions=300, totalChurn=1200
    // churnRatio = 300/1200 = 0.25
    expect(result.churnRatio).toBe(0.25);
    expect(result.totalAdditions).toBe(900);
    expect(result.totalDeletions).toBe(300);
  });

  it("should return 0 churnRatio when there is no churn", () => {
    const commits: ForensicCommit[] = [];
    const result = calculateCodeChurnAnalytics(commits);
    expect(result.churnRatio).toBe(0);
  });

  it("should exclude non-detailed commits from size distribution", () => {
    const commits = [
      makeCommit("good1", 100, 50, true),
      makeCommit("good2", 200, 100, true),
      makeCommit("noDetail1", 0, 0, false),
      makeCommit("noDetail2", 0, 0, false),
    ];

    const result = calculateCodeChurnAnalytics(commits);
    // Only 2 detailed commits counted in size metrics
    expect(result.commitSizeDistribution.tiny).toBe(0);
    expect(result.totalAdditions).toBe(300);
    expect(result.totalDeletions).toBe(150);
    expect(result.averageCommitAdditions).toBe(150);
    expect(result.averageCommitDeletions).toBe(75);
  });

  it("should exclude zero-churn fetch-failure artifacts from smallestCommit", () => {
    const commits = [
      makeCommit("good", 100, 50, true),
      makeCommit("failed", 0, 0, false),
    ];

    const result = calculateCodeChurnAnalytics(commits);
    expect(result.smallestCommit?.sha).toBe("good");
  });

  it("should include zero-churn commits in size distribution", () => {
    const commits = [
      makeCommit("good", 100, 50, true),
      makeCommit("failed", 0, 0, false),
    ];

    const result = calculateCodeChurnAnalytics(commits);
    // Non-detailed commits are excluded from distribution
    expect(result.commitSizeDistribution.tiny).toBe(0);
  });
});

describe("Commit Forensics — Unified Ratio Formula", () => {
  it("should use the same churnRatio formula as churn analytics", () => {
    const commits = [
      makeCommit("sha1", 800, 200),
      makeCommit("sha2", 100, 100),
    ];

    const result = analyzeCommitForensics(commits, "test");
    // totalAdditions=900, totalDeletions=300, totalChurn=1200
    // churnRatio = 300/1200 = 0.25
    expect(result.churnRatio).toBe(0.25);
  });

  it("should break largest-commit ties deterministically by SHA", () => {
    const commits = [
      makeCommit("bbb", 100, 50),
      makeCommit("aaa", 100, 50),
    ];

    const result = analyzeCommitForensics(commits, "test");
    expect(result.largestCommit?.sha).toBe("aaa");
  });
});
