import { describe, it, expect } from "vitest";
import { analyzeCommitForensics } from "@/lib/analytics/commitForensics";
import { ForensicCommit } from "@/types/domain";

function makeCommitWithDetails(
  sha: string,
  additions: number,
  deletions: number,
  hasDetails: boolean
): ForensicCommit {
  return {
    sha,
    repoFullName: "user/repo",
    authorLogin: "user",
    authorDate: "2026-05-10T10:00:00Z",
    message: `commit ${sha}`,
    additions,
    deletions,
    filesChanged: 1,
    isMerge: false,
    isRevert: false,
    hour: 10,
    weekday: 2,
    month: "2026-05",
    hasDetails,
  };
}

describe("Commit Forensics Engine", () => {
  it("should categorize commit messages into correct intent categories", () => {
    const commits: ForensicCommit[] = [
      {
        sha: "a1b2c3d4",
        repoFullName: "user/repo",
        authorLogin: "user",
        authorDate: "2026-05-10T12:00:00Z",
        message: "feat: add user authentication flow",
        additions: 120,
        deletions: 10,
        filesChanged: 4,
        isMerge: false,
        isRevert: false,
        hour: 12,
        weekday: 2,
        month: "2026-05",
        hasDetails: true,
      },
      {
        sha: "e5f6g7h8",
        repoFullName: "user/repo",
        authorLogin: "user",
        authorDate: "2026-05-11T14:00:00Z",
        message: "fix: resolve edge case crash in token parser",
        additions: 5,
        deletions: 2,
        filesChanged: 1,
        isMerge: false,
        isRevert: false,
        hour: 14,
        weekday: 3,
        month: "2026-05",
        hasDetails: true,
      },
      {
        sha: "i9j0k1l2",
        repoFullName: "user/repo",
        authorLogin: "user",
        authorDate: "2026-05-12T03:00:00Z",
        message: "wip experimental cache layer without colon",
        additions: 45,
        deletions: 0,
        filesChanged: 2,
        isMerge: false,
        isRevert: false,
        hour: 3,
        weekday: 4,
        month: "2026-05",
        hasDetails: true,
      },
    ];

    const result = analyzeCommitForensics(commits, "user");

    expect(result.totalAnalyzed).toBe(3);
    const feat = result.messageCategories.find((c) => c.category === "FEAT");
    const fix = result.messageCategories.find((c) => c.category === "FIX");
    const wip = result.messageCategories.find((c) => c.category === "WIP");

    expect(feat?.count).toBe(1);
    expect(fix?.count).toBe(1);
    expect(wip?.count).toBe(1);
    expect(result.conventionalCommitCount).toBe(2);
  });

  it("should accurately track size spectrum distribution and largest commit", () => {
    const commits: ForensicCommit[] = [
      {
        sha: "tiny001",
        repoFullName: "user/repo",
        authorLogin: "user",
        authorDate: "2026-05-10T10:00:00Z",
        message: "fix: typo",
        additions: 2,
        deletions: 1,
        filesChanged: 1,
        isMerge: false,
        isRevert: false,
        hour: 10,
        weekday: 2,
        month: "2026-05",
        hasDetails: true,
      },
      {
        sha: "monster001",
        repoFullName: "user/big-app",
        authorLogin: "user",
        authorDate: "2026-05-10T03:30:00Z",
        message: "refactor: rewrite entire core engine",
        additions: 4200,
        deletions: 1100,
        filesChanged: 85,
        isMerge: false,
        isRevert: false,
        hour: 3,
        weekday: 2,
        month: "2026-05",
        hasDetails: true,
      },
    ];

    const result = analyzeCommitForensics(commits, "user");
    expect(result.sizeDistribution.tiny).toBe(1);
    expect(result.sizeDistribution.monster).toBe(1);
    expect(result.largestCommit?.sha).toBe("monster001");
    expect(result.largestCommit?.additions).toBe(4200);
  });

  it("should compute size metrics only from detailed commits and report detailedCommitsCount", () => {
    const commitsWithDetails: ForensicCommit[] = [
      makeCommitWithDetails("d1", 100, 50, true),
      makeCommitWithDetails("d2", 200, 100, true),
    ];
    const commitsWithoutDetails: ForensicCommit[] = [
      makeCommitWithDetails("n1", 0, 0, false),
      makeCommitWithDetails("n2", 0, 0, false),
    ];
    const allCommits = [...commitsWithDetails, ...commitsWithoutDetails];

    const result = analyzeCommitForensics(allCommits, "user");
    expect(result.totalAnalyzed).toBe(4);
    expect(result.detailedCommitsCount).toBe(2);
    // Averages computed from 2 detailed commits, not 4 total
    expect(result.averageAdditionsPerCommit).toBe(150);
    expect(result.averageDeletionsPerCommit).toBe(75);
    // Size distribution only has 2 entries (the detailed ones)
    const totalInDistribution =
      result.sizeDistribution.tiny +
      result.sizeDistribution.small +
      result.sizeDistribution.medium +
      result.sizeDistribution.large +
      result.sizeDistribution.monster;
    expect(totalInDistribution).toBe(2);
  });
});
