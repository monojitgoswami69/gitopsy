/**
 * COMMIT MESSAGE FORENSICS ENGINE
 * Categorizes commit messages using deterministic pattern matching and verifiable metrics.
 * Strictly analytical: categorizes message intent, lengths, prefixes, repeated patterns, and size distribution.
 */

import { ForensicCommit, CommitForensics, CommitMessageCategory } from "@/types/domain";

export function analyzeCommitForensics(
  commits: ForensicCommit[],
  authorLogin: string
): CommitForensics {
  const totalAnalyzed = commits.length;
  if (totalAnalyzed === 0) {
    return {
      totalAnalyzed: 0,
      averageAdditionsPerCommit: 0,
      averageDeletionsPerCommit: 0,
      medianCommitSize: 0,
      churnRatio: 0,
      sizeDistribution: { tiny: 0, small: 0, medium: 0, large: 0, monster: 0 },
      messageCategories: [],
      shortMessageCount: 0,
      repeatedMessageCount: 0,
      conventionalCommitCount: 0,
      largestCommit: null,
    };
  }

  let totalAdditions = 0;
  let totalDeletions = 0;
  let shortMessageCount = 0;
  let conventionalCommitCount = 0;

  const categoryCounts: Record<string, number> = {
    FEAT: 0,
    FIX: 0,
    REFACTOR: 0,
    DOCS: 0,
    CHORE: 0,
    TEST: 0,
    PERF: 0,
    WIP: 0,
    MERGE: 0,
    REVERT: 0,
    OTHER: 0,
  };

  const messageMap = new Map<string, number>();
  const sizes: number[] = [];
  const sizeDistribution = { tiny: 0, small: 0, medium: 0, large: 0, monster: 0 };
  let largestCommit: CommitForensics["largestCommit"] = null;
  let maxLines = 0;

  for (const c of commits) {
    totalAdditions += c.additions;
    totalDeletions += c.deletions;
    const totalLines = c.additions + c.deletions;
    sizes.push(totalLines);

    if (totalLines > maxLines) {
      maxLines = totalLines;
      largestCommit = {
        sha: c.sha,
        repoFullName: c.repoFullName,
        message: c.message,
        additions: c.additions,
        deletions: c.deletions,
        filesChanged: c.filesChanged,
      };
    }

    // Size distribution
    if (totalLines < 10) sizeDistribution.tiny++;
    else if (totalLines <= 50) sizeDistribution.small++;
    else if (totalLines <= 200) sizeDistribution.medium++;
    else if (totalLines <= 1000) sizeDistribution.large++;
    else sizeDistribution.monster++;

    const msg = c.message.trim();
    const msgLower = msg.toLowerCase();

    // Track repeated messages
    const count = messageMap.get(msgLower) || 0;
    messageMap.set(msgLower, count + 1);

    // Short message check (< 10 chars)
    if (msg.length < 10) shortMessageCount++;

    // Conventional commit check (e.g. feat:, fix(scope):, docs:)
    if (/^[a-z]+(\([a-z0-9_.-]+\))?!?:/i.test(msg)) {
      conventionalCommitCount++;
    }

    // Categorization
    if (/^feat(\(.*\))?:|^add\b|^create\b|^implement\b/i.test(msg)) {
      categoryCounts.FEAT++;
    } else if (/^fix(\(.*\))?:|^bug\b|^patch\b|^resolve\b/i.test(msg)) {
      categoryCounts.FIX++;
    } else if (/^refactor(\(.*\))?:|^clean\b|^rewrite\b/i.test(msg)) {
      categoryCounts.REFACTOR++;
    } else if (/^docs(\(.*\))?:|^readme\b|^doc\b/i.test(msg)) {
      categoryCounts.DOCS++;
    } else if (/^chore(\(.*\))?:|^bump\b|^deps\b|^build\b/i.test(msg)) {
      categoryCounts.CHORE++;
    } else if (/^test(\(.*\))?:|^spec\b/i.test(msg)) {
      categoryCounts.TEST++;
    } else if (/^perf(\(.*\))?:|^optimize\b/i.test(msg)) {
      categoryCounts.PERF++;
    } else if (/^wip\b|work in progress/i.test(msg)) {
      categoryCounts.WIP++;
    } else if (c.isMerge || /^merge\b/i.test(msg)) {
      categoryCounts.MERGE++;
    } else if (c.isRevert || /^revert\b/i.test(msg)) {
      categoryCounts.REVERT++;
    } else {
      categoryCounts.OTHER++;
    }
  }

  // Count repeated messages
  let repeatedMessageCount = 0;
  messageMap.forEach((count) => {
    if (count > 1) repeatedMessageCount += count;
  });

  // Calculate median
  sizes.sort((a, b) => a - b);
  const mid = Math.floor(sizes.length / 2);
  const medianCommitSize = sizes.length % 2 !== 0 ? sizes[mid] : Math.round((sizes[mid - 1] + sizes[mid]) / 2);

  const messageCategories: CommitMessageCategory[] = Object.entries(categoryCounts)
    .filter(([_, count]) => count > 0)
    .map(([category, count]) => ({
      category,
      count,
      percentage: Math.round((count / totalAnalyzed) * 100),
    }))
    .sort((a, b) => b.count - a.count);

  const totalChurn = totalAdditions + totalDeletions;
  const churnRatio = totalChurn > 0 ? Number((totalDeletions / totalChurn).toFixed(2)) : 0;

  return {
    totalAnalyzed,
    averageAdditionsPerCommit: Math.round(totalAdditions / totalAnalyzed),
    averageDeletionsPerCommit: Math.round(totalDeletions / totalAnalyzed),
    medianCommitSize,
    churnRatio,
    sizeDistribution,
    messageCategories,
    shortMessageCount,
    repeatedMessageCount,
    conventionalCommitCount,
    largestCommit,
  };
}
