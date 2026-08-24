import { ForensicCommit } from "@/types/domain";

export interface CodeChurnAnalytics {
  totalAdditions: number;
  totalDeletions: number;
  netLines: number;
  totalFilesChanged: number;
  churnRatio: number; // deletions / additions
  averageCommitAdditions: number;
  averageCommitDeletions: number;
  largestCommit: ForensicCommit | null;
  smallestCommit: ForensicCommit | null;
  medianCommitSize: number;
  commitSizeDistribution: {
    tiny: number; // < 10 lines
    small: number; // 10 - 50 lines
    medium: number; // 50 - 200 lines
    large: number; // 200 - 1000 lines
    monster: number; // > 1000 lines
  };
}

export function calculateCodeChurnAnalytics(commits: ForensicCommit[]): CodeChurnAnalytics {
  let totalAdditions = 0;
  let totalDeletions = 0;
  let totalFilesChanged = 0;
  let largestCommit: ForensicCommit | null = null;
  let smallestCommit: ForensicCommit | null = null;
  let maxTotal = -1;
  let minTotal = Infinity;

  const distribution = {
    tiny: 0,
    small: 0,
    medium: 0,
    large: 0,
    monster: 0,
  };

  const sizes: number[] = [];

  for (const c of commits) {
    totalAdditions += c.additions;
    totalDeletions += c.deletions;
    totalFilesChanged += c.filesChanged;

    const totalChange = c.additions + c.deletions;
    sizes.push(totalChange);

    if (totalChange > maxTotal) {
      maxTotal = totalChange;
      largestCommit = c;
    }
    if (totalChange < minTotal) {
      minTotal = totalChange;
      smallestCommit = c;
    }

    if (totalChange < 10) distribution.tiny++;
    else if (totalChange <= 50) distribution.small++;
    else if (totalChange <= 200) distribution.medium++;
    else if (totalChange <= 1000) distribution.large++;
    else distribution.monster++;
  }

  sizes.sort((a, b) => a - b);
  const mid = Math.floor(sizes.length / 2);
  const medianCommitSize = sizes.length === 0 ? 0 : sizes.length % 2 !== 0 ? sizes[mid] : Math.round((sizes[mid - 1] + sizes[mid]) / 2);

  const count = Math.max(1, commits.length);

  return {
    totalAdditions,
    totalDeletions,
    netLines: totalAdditions - totalDeletions,
    totalFilesChanged,
    churnRatio: totalAdditions > 0 ? Math.round((totalDeletions / totalAdditions) * 100) / 100 : 0,
    averageCommitAdditions: Math.round(totalAdditions / count),
    averageCommitDeletions: Math.round(totalDeletions / count),
    largestCommit,
    smallestCommit: smallestCommit || null,
    medianCommitSize,
    commitSizeDistribution: distribution,
  };
}
