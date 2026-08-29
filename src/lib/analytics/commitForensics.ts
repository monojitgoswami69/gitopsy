import { ForensicCommit, CommitForensics, CommitMessageCategory, CommitRemark } from "@/types/domain";

function stableHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function analyzeCommitForensics(
  commits: ForensicCommit[],
  authorLogin: string
): CommitForensics {
  const totalAnalyzed = commits.length;
  if (totalAnalyzed === 0) {
    return {
      totalAnalyzed: 0,
      detailedCommitsCount: 0,
      averageAdditionsPerCommit: 0,
      averageDeletionsPerCommit: 0,
      medianCommitSize: 0,
      averageMessageLength: 0,
      churnRatio: 0,
      sizeDistribution: { tiny: 0, small: 0, medium: 0, large: 0, monster: 0 },
      messageCategories: [],
      shortMessageCount: 0,
      longMessageCount: 0,
      repeatedMessageCount: 0,
      conventionalCommitCount: 0,
      remarks: [],
      largestCommit: null,
      topVolumeCommits: [],
    };
  }

  // Split into detailed (with real churn) and all (for message analysis)
  const detailedCommits = commits.filter((c) => c.hasDetails);
  const detailedCount = detailedCommits.length;

  let totalAdditions = 0;
  let totalDeletions = 0;
  let shortMessageCount = 0;
  let longMessageCount = 0;
  let totalMessageLength = 0;
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
  const candidateRemarks: CommitRemark[] = [];

  // Message-based metrics: iterate ALL commits (not just detailed ones)
  for (const c of commits) {
    const msg = c.message.trim();
    const msgLower = msg.toLowerCase();
    totalMessageLength += msg.length;

    // Track repeated messages
    const count = messageMap.get(msgLower) || 0;
    messageMap.set(msgLower, count + 1);

    // Short message check (< 10 chars)
    if (msg.length < 10) shortMessageCount++;
    if (msg.length >= 80) longMessageCount++;

    // Conventional commit check (e.g. feat:, fix(scope):, docs:)
    const isConventional = /^[a-z]+(\([a-z0-9_.-]+\))?!?:/i.test(msg);
    if (isConventional) {
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

    // Deterministic forensic note candidate evaluation
    if (/^wip\b|work in progress/i.test(msg)) {
      const hashIdx = stableHash(authorLogin + c.sha) % 2;
      const templates = [
        `Checkpoint commit pushed to ${c.repoFullName}.`,
        `Direct snapshot commit logged during active engineering.`,
      ];
      candidateRemarks.push({
        id: `remark-${c.sha}`,
        sha: c.sha,
        repoFullName: c.repoFullName,
        authorDate: c.authorDate,
        message: msg,
        remarkTitle: "WIP Checkpoint",
        remarkText: templates[hashIdx],
        type: "WIP",
      });
    } else if (/^fix(\(.*\))?:/i.test(msg) && c.filesChanged > 0) {
      candidateRemarks.push({
        id: `remark-${c.sha}`,
        sha: c.sha,
        repoFullName: c.repoFullName,
        authorDate: c.authorDate,
        message: msg,
        remarkTitle: "Correctional Patch",
        remarkText: `Applied patch across ${c.filesChanged} file(s) in ${c.repoFullName}.`,
        type: "FIX_SPAM",
      });
    } else if (msg.length < 6) {
      candidateRemarks.push({
        id: `remark-${c.sha}`,
        sha: c.sha,
        repoFullName: c.repoFullName,
        authorDate: c.authorDate,
        message: msg,
        remarkTitle: "Minimalist Description",
        remarkText: `Terse commit log entry (${msg.length} characters).`,
        type: "MINIMALIST",
      });
    }
  }

  // Size-based metrics: iterate ONLY detailed commits
  for (const c of detailedCommits) {
    totalAdditions += c.additions;
    totalDeletions += c.deletions;
    const totalLines = c.additions + c.deletions;
    sizes.push(totalLines);

    // Deterministic tie-breaking: prefer the commit with the lower SHA
    if (totalLines > maxLines || (totalLines === maxLines && largestCommit && c.sha < largestCommit.sha)) {
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
  }

  // Count repeated messages
  let repeatedMessageCount = 0;
  messageMap.forEach((count) => {
    if (count > 1) repeatedMessageCount += count;
  });

  // Calculate median from detailed commits only
  sizes.sort((a, b) => a - b);
  const mid = Math.floor(sizes.length / 2);
  const medianCommitSize = sizes.length === 0 ? 0 : sizes.length % 2 !== 0 ? sizes[mid] : Math.round((sizes[mid - 1] + sizes[mid]) / 2);

  const messageCategories: CommitMessageCategory[] = Object.entries(categoryCounts)
    .filter(([_, count]) => count > 0)
    .map(([category, count]) => ({
      category,
      count,
      percentage: Math.round((count / totalAnalyzed) * 100),
    }))
    .sort((a, b) => b.count - a.count);

  // Unified churn ratio: deletions / (additions + deletions), from detailed commits
  const totalChurn = totalAdditions + totalDeletions;
  const churnRatio = totalChurn > 0 ? Number((totalDeletions / totalChurn).toFixed(2)) : 0;

  // Averages computed from detailed commits only
  const avgBase = Math.max(1, detailedCount);
  const averageAdditions = Math.round(totalAdditions / avgBase);
  const averageDeletions = Math.round(totalDeletions / avgBase);
  const averageMessageLength = Math.round(totalMessageLength / totalAnalyzed);

  // Pick top 4 distinct remarks
  const remarks = candidateRemarks.slice(0, 4);

  // Top 3 volume commits
  const topVolumeCommits = [...detailedCommits]
    .sort((a, b) => {
      const volA = a.additions + a.deletions;
      const volB = b.additions + b.deletions;
      if (volB !== volA) return volB - volA;
      return a.sha.localeCompare(b.sha);
    })
    .slice(0, 3)
    .map((c) => ({
      sha: c.sha,
      repoFullName: c.repoFullName,
      message: c.message,
      additions: c.additions,
      deletions: c.deletions,
      filesChanged: c.filesChanged,
      authorDate: c.authorDate,
    }));

  return {
    totalAnalyzed,
    detailedCommitsCount: detailedCount,
    averageAdditionsPerCommit: averageAdditions,
    averageDeletionsPerCommit: averageDeletions,
    medianCommitSize,
    averageMessageLength,
    churnRatio,
    sizeDistribution,
    messageCategories,
    shortMessageCount,
    longMessageCount,
    repeatedMessageCount,
    conventionalCommitCount,
    remarks,
    largestCommit: largestCommit || topVolumeCommits[0] || null,
    topVolumeCommits,
  };
}
