/**
 * DETERMINISTIC ASSESSMENTS ENGINE
 * Every assessment is calculated strictly from verified GitHub metrics with transparent evidence criteria.
 */

import { DeveloperClassification, ForensicCommit, RepositoryAnalysis, TemporalActivity } from "@/types/domain";

export interface ClassificationContext {
  commits: ForensicCommit[];
  repositories: RepositoryAnalysis[];
  temporal: TemporalActivity;
  summary: {
    totalCommits: number;
    totalActiveDays: number;
    longestStreakDays: number;
    nightCommitPercentage: number;
    weekendCommitPercentage: number;
    busiestHour: number;
    busiestWeekday?: string;
    longestInactiveGapDays?: number;
    peakDailyCommits?: number;
    averageDailyCommits?: number;
    functionalLanguageCount?: number;
    prsAuthored?: number;
    reviewsAuthored?: number;
    timezone?: string;
    timezoneAbbr?: string;
  };
  churn: {
    churnRatio: number;
    totalDeletions: number;
    totalAdditions: number;
  };
  commitForensics: {
    medianCommitSize: number;
    averageMessageLength: number;
    shortMessageCount: number;
    longMessageCount: number;
    conventionalCommitCount: number;
    detailedCommitsCount: number;
  };
  languages: { name: string; bytes: number; percentage: number; isFunctional?: boolean }[];
  commitCategories: { category: string; count: number; percentage: number }[];
}

export function computeDeveloperClassifications(ctx: ClassificationContext): DeveloperClassification[] {
  const { commits, repositories, temporal, summary, churn, commitForensics, languages, commitCategories } = ctx;
  const totalCommits = Math.max(1, summary.totalCommits);
  const totalRepos = Math.max(1, repositories.length);
  const detailedCommits = commitForensics.detailedCommitsCount || 0;

  const classifications: DeveloperClassification[] = [];

  function getStrength(sampleSize: number, margin: number): DeveloperClassification["evidenceStrength"] {
    if (sampleSize < 15) return "LOW";
    if (sampleSize < 40 || margin < 5) return "MODERATE";
    if (margin < 20) return "HIGH";
    return "VERY HIGH";
  }

  const tzAbbr = summary.timezoneAbbr || temporal.timezoneAbbr || "local";

  // 1. NIGHT OWL
  // >= 35% of commits between 21:00 and 04:59 in local time, min 20 commits
  const nightThreshold = 35;
  const nightMargin = summary.nightCommitPercentage - nightThreshold;
  const isNightOwl = summary.nightCommitPercentage >= nightThreshold && totalCommits >= 20;
  classifications.push({
    id: "night-owl",
    title: "NIGHT OWL",
    tagline: "High volume of development activity during late-night hours.",
    description: `A substantial percentage of your timestamped commits occur between 21:00 and 04:59 ${tzAbbr}.`,
    badgeAccent: "#C084FC",
    evidenceStrength: getStrength(totalCommits, nightMargin),
    evidence: [
      {
        criterion: `Late-night commit share (21:00 - 04:59 ${tzAbbr})`,
        actualValue: `${summary.nightCommitPercentage}%`,
        threshold: "≥ 35%",
        isSatisfied: summary.nightCommitPercentage >= nightThreshold,
      },
      {
        criterion: "Sample size",
        actualValue: `${totalCommits} commits`,
        threshold: "≥ 20 commits",
        isSatisfied: totalCommits >= 20,
      },
    ],
  });

  // 2. MORNING SKYLARK
  // >= 25% of commits between 05:00 and 09:59 in local time, min 20 commits
  const morningCommits = temporal.byHour.slice(5, 10).reduce((a, b) => a + b, 0);
  const morningPercentage = Math.round((morningCommits / totalCommits) * 100);
  const isMorning = morningPercentage >= 25 && totalCommits >= 20;
  classifications.push({
    id: "morning-skylark",
    title: "MORNING SKYLARK",
    tagline: "Concentration of activity during early morning hours.",
    description: `A large portion of your commit timestamps are recorded between 05:00 and 09:59 ${tzAbbr}.`,
    badgeAccent: "#38BDF8",
    evidenceStrength: getStrength(totalCommits, morningPercentage - 25),
    evidence: [
      {
        criterion: `Early-morning commit share (05:00 - 09:59 ${tzAbbr})`,
        actualValue: `${morningPercentage}%`,
        threshold: "≥ 25%",
        isSatisfied: morningPercentage >= 25,
      },
      {
        criterion: "Sample size",
        actualValue: `${totalCommits} commits`,
        threshold: "≥ 20 commits",
        isSatisfied: totalCommits >= 20,
      },
    ],
  });

  // 3. WEEKEND WARRIOR
  // >= 35% of commits on Saturday or Sunday, min 20 commits
  const weekendThreshold = 35;
  const weekendMargin = summary.weekendCommitPercentage - weekendThreshold;
  const isWeekendWarrior = summary.weekendCommitPercentage >= weekendThreshold && totalCommits >= 20;
  classifications.push({
    id: "weekend-warrior",
    title: "WEEKEND WARRIOR",
    tagline: "Elevated activity recorded on Saturdays and Sundays.",
    description: "A notable proportion of your commit activity is deployed on weekend days relative to the weekly baseline.",
    badgeAccent: "#FFDC58",
    evidenceStrength: getStrength(totalCommits, weekendMargin),
    evidence: [
      {
        criterion: "Weekend commit percentage (Saturday & Sunday)",
        actualValue: `${summary.weekendCommitPercentage}%`,
        threshold: "≥ 35%",
        isSatisfied: summary.weekendCommitPercentage >= weekendThreshold,
      },
      {
        criterion: "Sample size",
        actualValue: `${totalCommits} commits`,
        threshold: "≥ 20 commits",
        isSatisfied: totalCommits >= 20,
      },
    ],
  });

  // 4. WEEKDAY OPERATOR
  // >= 90% of commits on Monday through Friday, min 30 commits
  const weekdayCommitsPct = 100 - summary.weekendCommitPercentage;
  const isWeekday = weekdayCommitsPct >= 90 && totalCommits >= 30;
  classifications.push({
    id: "weekday-operator",
    title: "WEEKDAY OPERATOR",
    tagline: "Activity concentrated almost exclusively during standard weekdays.",
    description: "Almost all of your engineering output occurs Monday through Friday with minimal weekend activity.",
    badgeAccent: "#34D399",
    evidenceStrength: getStrength(totalCommits, weekdayCommitsPct - 90),
    evidence: [
      {
        criterion: "Weekday commit percentage (Monday - Friday)",
        actualValue: `${weekdayCommitsPct}%`,
        threshold: "≥ 90%",
        isSatisfied: weekdayCommitsPct >= 90,
      },
      {
        criterion: "Sample size",
        actualValue: `${totalCommits} commits`,
        threshold: "≥ 30 commits",
        isSatisfied: totalCommits >= 30,
      },
    ],
  });

  // 5. ATOMIC COMMITTER
  // Median commit size <= 35 lines, min 15 detailed commits
  const isAtomic = commitForensics.medianCommitSize <= 35 && detailedCommits >= 15 && commitForensics.medianCommitSize > 0;
  classifications.push({
    id: "atomic-committer",
    title: "ATOMIC COMMITTER",
    tagline: "Frequently commits in small, focused increments.",
    description: "The 50th-percentile commit size is compact, indicating modular and granular version control habits.",
    badgeAccent: "#4D96FF",
    evidenceStrength: getStrength(detailedCommits, 35 - commitForensics.medianCommitSize),
    evidence: [
      {
        criterion: "Median commit size (additions + deletions)",
        actualValue: `${commitForensics.medianCommitSize} lines`,
        threshold: "≤ 35 lines",
        isSatisfied: commitForensics.medianCommitSize <= 35 && commitForensics.medianCommitSize > 0,
      },
      {
        criterion: "Sample size (detailed diffs)",
        actualValue: `${detailedCommits} commits`,
        threshold: "≥ 15 detailed commits",
        isSatisfied: detailedCommits >= 15,
      },
    ],
  });

  // 6. BATCH DEPLOYER
  // Median commit size >= 250 lines, min 10 detailed commits
  const isBatch = commitForensics.medianCommitSize >= 250 && detailedCommits >= 10;
  classifications.push({
    id: "batch-deployer",
    title: "BATCH DEPLOYER",
    tagline: "Bundles substantial changes into single commits.",
    description: "The median commit size shows a preference for large batch modifications rather than micro-diffs.",
    badgeAccent: "#F87171",
    evidenceStrength: getStrength(detailedCommits, commitForensics.medianCommitSize - 250),
    evidence: [
      {
        criterion: "Median commit size (additions + deletions)",
        actualValue: `${commitForensics.medianCommitSize} lines`,
        threshold: "≥ 250 lines",
        isSatisfied: commitForensics.medianCommitSize >= 250,
      },
      {
        criterion: "Sample size",
        actualValue: `${detailedCommits} detailed commits`,
        threshold: "≥ 10 detailed commits",
        isSatisfied: detailedCommits >= 10,
      },
    ],
  });

  // 7. CONVENTIONAL DISCIPLINE
  // >= 70% conventional commit messages, min 20 commits
  const conventionalPercentage = Math.round((commitForensics.conventionalCommitCount / totalCommits) * 100);
  const isConventional = conventionalPercentage >= 70 && totalCommits >= 20;
  classifications.push({
    id: "conventional-discipline",
    title: "CONVENTIONAL DISCIPLINE",
    tagline: "Consistently structures commit messages with standardized semantic prefixes.",
    description: "A high percentage of your commit messages adhere to structured specifications like Conventional Commits.",
    badgeAccent: "#2DD4BF",
    evidenceStrength: getStrength(totalCommits, conventionalPercentage - 70),
    evidence: [
      {
        criterion: "Conventional commit format adoption",
        actualValue: `${conventionalPercentage}%`,
        threshold: "≥ 70%",
        isSatisfied: conventionalPercentage >= 70,
      },
      {
        criterion: "Sample size",
        actualValue: `${totalCommits} commits`,
        threshold: "≥ 20 commits",
        isSatisfied: totalCommits >= 20,
      },
    ],
  });

  // 8. REFACTOR MACHINE
  // Deletion ratio >= 40% and total deletions >= 500 lines, min 20 commits
  const isRefactor = churn.churnRatio >= 0.4 && churn.totalDeletions >= 500 && totalCommits >= 20;
  classifications.push({
    id: "refactor-machine",
    title: "REFACTOR MACHINE",
    tagline: "High proportion of code deletions relative to additions.",
    description: "Your deletion-to-addition ratio shows a substantial emphasis on pruning and restructuring existing code.",
    badgeAccent: "#FB7185",
    evidenceStrength: getStrength(totalCommits, (churn.churnRatio - 0.4) * 100),
    evidence: [
      {
        criterion: "Deletion to total churn ratio",
        actualValue: `${Math.round(churn.churnRatio * 100)}%`,
        threshold: "≥ 40%",
        isSatisfied: churn.churnRatio >= 0.4,
      },
      {
        criterion: "Total lines deleted across commits",
        actualValue: `${churn.totalDeletions.toLocaleString()} lines`,
        threshold: "≥ 500 lines",
        isSatisfied: churn.totalDeletions >= 500,
      },
    ],
  });

  // 9. ONE-PROJECT SPECIALIST
  // >= 65% of all activity concentrated in a single repository, min 25 commits
  const sortedRepos = [...repositories].sort((a, b) => b.commitCount - a.commitCount);
  const topRepo = sortedRepos[0];
  const topRepoCommits = topRepo?.commitCount || 0;
  const topRepoRatio = Math.round((topRepoCommits / totalCommits) * 100);
  const isSpecialist = topRepoRatio >= 65 && totalCommits >= 25;
  classifications.push({
    id: "one-project-specialist",
    title: "ONE-PROJECT SPECIALIST",
    tagline: "Activity concentrated in a single primary repository.",
    description: "The majority of your logged engineering commits are concentrated in one flagship repository.",
    badgeAccent: "#6BCB77",
    evidenceStrength: getStrength(totalCommits, topRepoRatio - 65),
    evidence: [
      {
        criterion: "Concentration in primary repository",
        actualValue: `${topRepoRatio}% in ${topRepo?.name || "primary repo"}`,
        threshold: "≥ 65%",
        isSatisfied: topRepoRatio >= 65,
      },
      {
        criterion: "Sample size",
        actualValue: `${totalCommits} commits`,
        threshold: "≥ 25 commits",
        isSatisfied: totalCommits >= 25,
      },
    ],
  });

  // 10. ECOSYSTEM EXPLORER
  // >= 8 repos, no single repo holds > 30% of total commits, min 40 commits
  const isExplorer = totalRepos >= 8 && topRepoRatio <= 30 && totalCommits >= 40;
  classifications.push({
    id: "ecosystem-explorer",
    title: "ECOSYSTEM EXPLORER",
    tagline: "Maintains an evenly distributed multi-repository portfolio.",
    description: "Your commit activity is spread across numerous repositories without any single codebase dominating.",
    badgeAccent: "#A78BFA",
    evidenceStrength: getStrength(totalCommits, 30 - topRepoRatio),
    evidence: [
      {
        criterion: "Total accessible repositories",
        actualValue: `${totalRepos} repos`,
        threshold: "≥ 8 repos",
        isSatisfied: totalRepos >= 8,
      },
      {
        criterion: "Maximum single-repository share",
        actualValue: `${topRepoRatio}%`,
        threshold: "≤ 30%",
        isSatisfied: topRepoRatio <= 30,
      },
    ],
  });

  // 11. REPOSITORY HOARDER
  // >= 12 repositories with >= 50% having <= 2 commits
  const quietRepos = repositories.filter((r) => r.commitCount <= 2).length;
  const quietRatio = Math.round((quietRepos / totalRepos) * 100);
  const isHoarder = totalRepos >= 12 && quietRatio >= 50;
  classifications.push({
    id: "repository-hoarder",
    title: "REPOSITORY HOARDER",
    tagline: "Large collection of early-stage or starter repositories.",
    description: "You have a high repository count where more than half have two or fewer recorded commits.",
    badgeAccent: "#FD9745",
    evidenceStrength: getStrength(totalRepos, quietRatio - 50),
    evidence: [
      {
        criterion: "Total accessible repositories",
        actualValue: `${totalRepos} repos`,
        threshold: "≥ 12 repos",
        isSatisfied: totalRepos >= 12,
      },
      {
        criterion: "Percentage with ≤ 2 commits",
        actualValue: `${quietRatio}% (${quietRepos} repos)`,
        threshold: "≥ 50%",
        isSatisfied: quietRatio >= 50,
      },
    ],
  });

  // 12. STEADY BUILDER
  // Streak >= 7 days and activity spread across all weekdays, min 25 commits
  const hasAllWeekdays = temporal.byWeekday.every((c) => c > 0);
  const isSteady = summary.longestStreakDays >= 7 && hasAllWeekdays && totalCommits >= 25;
  classifications.push({
    id: "steady-builder",
    title: "STEADY BUILDER",
    tagline: "Consistent day-over-day cadence across the full calendar week.",
    description: "You maintain regular coding streaks across all seven days of the week.",
    badgeAccent: "#60A5FA",
    evidenceStrength: getStrength(totalCommits, summary.longestStreakDays - 7),
    evidence: [
      {
        criterion: "Longest consecutive daily commit streak",
        actualValue: `${summary.longestStreakDays} days`,
        threshold: "≥ 7 days",
        isSatisfied: summary.longestStreakDays >= 7,
      },
      {
        criterion: "Activity logged on all 7 days of the week",
        actualValue: hasAllWeekdays ? "All 7 days active" : "Gaps on some weekdays",
        threshold: "All 7 weekdays > 0 commits",
        isSatisfied: hasAllWeekdays,
      },
    ],
  });

  // 13. FIX ADDICT
  // >= 20% of commit messages contain fix-related terms, min 20 commits
  const fixCategory = commitCategories.find((c) => c.category === "FIX");
  const fixPercentage = fixCategory ? fixCategory.percentage : 0;
  const isFixAddict = fixPercentage >= 20 && totalCommits >= 20;
  classifications.push({
    id: "fix-addict",
    title: "FIX ADDICT",
    tagline: "Frequent bug fixes, patches, and correctional commits.",
    description: "An unusually high percentage of commit messages explicitly declare bug fixes and patches.",
    badgeAccent: "#F43F5E",
    evidenceStrength: getStrength(totalCommits, fixPercentage - 20),
    evidence: [
      {
        criterion: "Percentage of commits containing 'fix' terminology",
        actualValue: `${fixPercentage}%`,
        threshold: "≥ 20%",
        isSatisfied: fixPercentage >= 20,
      },
      {
        criterion: "Sample size",
        actualValue: `${totalCommits} commits`,
        threshold: "≥ 20 commits",
        isSatisfied: totalCommits >= 20,
      },
    ],
  });

  // 14. WIP SPECIALIST
  // >= 5% of commits labeled 'wip' or 'work in progress', min 20 commits
  const wipCategory = commitCategories.find((c) => c.category === "WIP");
  const wipPercentage = wipCategory ? wipCategory.percentage : 0;
  const isWipSpecialist = wipPercentage >= 5 && totalCommits >= 20;
  classifications.push({
    id: "wip-specialist",
    title: "WIP SPECIALIST",
    tagline: "Frequently commits work-in-progress snapshots.",
    description: "A noticeable proportion of your commit messages are labeled as 'wip' or temporary checkpoints.",
    badgeAccent: "#F59E0B",
    evidenceStrength: getStrength(totalCommits, wipPercentage - 5),
    evidence: [
      {
        criterion: "Percentage of commits labeled 'WIP'",
        actualValue: `${wipPercentage}%`,
        threshold: "≥ 5%",
        isSatisfied: wipPercentage >= 5,
      },
      {
        criterion: "Sample size",
        actualValue: `${totalCommits} commits`,
        threshold: "≥ 20 commits",
        isSatisfied: totalCommits >= 20,
      },
    ],
  });

  // 15. MESSAGE MINIMALIST
  // Average message length < 15 characters, min 20 commits
  const isMinimalist = commitForensics.averageMessageLength < 15 && totalCommits >= 20 && commitForensics.averageMessageLength > 0;
  classifications.push({
    id: "message-minimalist",
    title: "MESSAGE MINIMALIST",
    tagline: "Writes concise, shorthand commit log entries.",
    description: "The average character length of your commit messages is compact.",
    badgeAccent: "#94A3B8",
    evidenceStrength: getStrength(totalCommits, 15 - commitForensics.averageMessageLength),
    evidence: [
      {
        criterion: "Average commit message length",
        actualValue: `${commitForensics.averageMessageLength} chars`,
        threshold: "< 15 characters",
        isSatisfied: commitForensics.averageMessageLength < 15 && commitForensics.averageMessageLength > 0,
      },
      {
        criterion: "Sample size",
        actualValue: `${totalCommits} commits`,
        threshold: "≥ 20 commits",
        isSatisfied: totalCommits >= 20,
      },
    ],
  });

  // 16. POLYGLOT INVESTIGATOR
  // >= 4 functional programming languages with >= 5% byte share
  const functionalLangs = languages.filter((l) => l.isFunctional !== false && l.percentage >= 5);
  const isPolyglot = functionalLangs.length >= 4;
  classifications.push({
    id: "polyglot-investigator",
    title: "POLYGLOT INVESTIGATOR",
    tagline: "Active across four or more distinct programming languages.",
    description: "GitHub reports substantial codebase bytes across four or more functional language dialects.",
    badgeAccent: "#818CF8",
    evidenceStrength: getStrength(functionalLangs.length * 15, (functionalLangs.length - 4) * 20),
    evidence: [
      {
        criterion: "Distinct functional languages with ≥ 5% byte share",
        actualValue: `${functionalLangs.length} languages`,
        threshold: "≥ 4 languages",
        isSatisfied: isPolyglot,
      },
    ],
  });

  // 17. SOLO OPERATOR (consolidated from easter egg)
  const isSolo = totalCommits >= 40 && summary.prsAuthored === 0 && summary.reviewsAuthored === 0;
  classifications.push({
    id: "solo-operator",
    title: "SOLO OPERATOR",
    tagline: "Direct branch and trunk deployment workflow.",
    description: "Substantial direct commit volume logged without formal pull requests or peer code review overhead.",
    badgeAccent: "#10B981",
    evidenceStrength: getStrength(totalCommits, totalCommits - 40),
    evidence: [
      {
        criterion: "Direct commit volume",
        actualValue: `${totalCommits} commits`,
        threshold: "≥ 40 commits",
        isSatisfied: totalCommits >= 40,
      },
      {
        criterion: "Pull requests & reviews overhead",
        actualValue: "0 PRs / 0 reviews",
        threshold: "0 PRs and 0 reviews",
        isSatisfied: Boolean(summary.prsAuthored === 0 && summary.reviewsAuthored === 0),
      },
    ],
  });

  // 18. ARTISANAL BUILDER (consolidated from easter egg)
  const isArtisanal = totalCommits >= 60 && repositories.every((r) => r.stars === 0 && r.forks === 0);
  classifications.push({
    id: "artisanal-builder",
    title: "ARTISANAL BUILDER",
    tagline: "Independent craft across solo personal repositories.",
    description: "Consistent development logged across private or independent repositories without public star tracking.",
    badgeAccent: "#EAB308",
    evidenceStrength: getStrength(totalCommits, totalCommits - 60),
    evidence: [
      {
        criterion: "Total analyzed commits",
        actualValue: `${totalCommits} commits`,
        threshold: "≥ 60 commits",
        isSatisfied: totalCommits >= 60,
      },
      {
        criterion: "Solo independent repositories",
        actualValue: `${totalRepos} repos (0 stars, 0 forks)`,
        threshold: "100% solo repos",
        isSatisfied: repositories.every((r) => r.stars === 0 && r.forks === 0),
      },
    ],
  });

  // Sort satisfied classifications first, then by evidence strength
  return classifications.sort((a, b) => {
    const aSatisfied = a.evidence.every((e) => e.isSatisfied) ? 1 : 0;
    const bSatisfied = b.evidence.every((e) => e.isSatisfied) ? 1 : 0;
    return bSatisfied - aSatisfied;
  });
}
