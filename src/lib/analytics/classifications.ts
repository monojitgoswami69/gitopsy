/**
 * DETERMINISTIC DEVELOPER ASSESSMENTS ENGINE
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
  const { repositories, temporal, summary, churn, commitForensics, languages, commitCategories } = ctx;
  const totalCommits = Math.max(0, summary.totalCommits || 0);
  const totalRepos = Math.max(0, repositories.length);
  const detailedCommits = commitForensics.detailedCommitsCount || 0;

  const classifications: DeveloperClassification[] = [];

  function getStrength(sampleSize: number, margin: number): DeveloperClassification["evidenceStrength"] {
    if (sampleSize < 15) return "LOW";
    if (sampleSize < 35 || margin < 5) return "MODERATE";
    if (margin < 20) return "HIGH";
    return "VERY HIGH";
  }

  const tzAbbr = summary.timezoneAbbr || temporal.timezoneAbbr || "local";

  // Temporal buckets calculation
  // Night: 21:00 - 04:59 (8 hours)
  const nightHours = [21, 22, 23, 0, 1, 2, 3, 4];
  const nightCommits = nightHours.reduce((acc, h) => acc + (temporal.byHour[h] || 0), 0);
  const nightPct = totalCommits > 0 ? Math.round((nightCommits / totalCommits) * 100) : 0;

  // Morning: 05:00 - 11:59 (7 hours)
  const morningCommits = temporal.byHour.slice(5, 12).reduce((a, b) => a + b, 0);
  const morningPct = totalCommits > 0 ? Math.round((morningCommits / totalCommits) * 100) : 0;

  // Afternoon: 12:00 - 16:59 (5 hours)
  const afternoonCommits = temporal.byHour.slice(12, 17).reduce((a, b) => a + b, 0);

  // Evening: 17:00 - 20:59 (4 hours)
  const eveningCommits = temporal.byHour.slice(17, 21).reduce((a, b) => a + b, 0);

  const daytimeCommits = morningCommits + afternoonCommits + eveningCommits;

  // Weekend vs Weekday
  const weekendCommits = (temporal.byWeekday[0] || 0) + (temporal.byWeekday[6] || 0);
  const weekendPct = totalCommits > 0 ? Math.round((weekendCommits / totalCommits) * 100) : 0;
  const weekdayCommits = totalCommits - weekendCommits;
  const weekdayPct = totalCommits > 0 ? Math.round((weekdayCommits / totalCommits) * 100) : 0;

  // 1. NIGHT SHIFT (Extreme nocturnal concentration)
  const isNightShift = totalCommits >= 25 && nightPct >= 75 && nightCommits >= 20;
  classifications.push({
    id: "night-shift",
    title: "NIGHT SHIFT",
    tagline: "Operating almost exclusively during nocturnal hours.",
    description: `Over 75% of your recorded engineering output occurs between 21:00 and 04:59 ${tzAbbr}, with minimal daytime activity.`,
    badgeAccent: "#7C3AED",
    evidenceStrength: getStrength(totalCommits, nightPct - 75),
    evidence: [
      {
        criterion: `Nocturnal commit dominance (21:00 - 04:59 ${tzAbbr})`,
        actualValue: `${nightPct}% (${nightCommits} commits)`,
        threshold: "≥ 75%",
        isSatisfied: nightPct >= 75,
      },
      {
        criterion: "Sample size",
        actualValue: `${totalCommits} commits`,
        threshold: "≥ 25 commits",
        isSatisfied: totalCommits >= 25,
      },
    ],
  });

  // 2. NIGHT OWL (Elevated late-night activity with meaningful volume exceeding afternoon baseline)
  const isNightOwl =
    totalCommits >= 25 &&
    nightPct >= 35 &&
    nightPct < 75 &&
    nightCommits >= 10 &&
    nightCommits > afternoonCommits;

  classifications.push({
    id: "night-owl",
    title: "NIGHT OWL",
    tagline: "High volume of development activity during late-night hours.",
    description: `A substantial percentage of your timestamped commits occur between 21:00 and 04:59 ${tzAbbr}.`,
    badgeAccent: "#C084FC",
    evidenceStrength: getStrength(totalCommits, nightPct - 35),
    evidence: [
      {
        criterion: `Late-night commit share (21:00 - 04:59 ${tzAbbr})`,
        actualValue: `${nightPct}% (${nightCommits} commits)`,
        threshold: "35% - 74%",
        isSatisfied: nightPct >= 35 && nightPct < 75,
      },
      {
        criterion: "Nocturnal activity vs afternoon volume",
        actualValue: `${nightCommits} night vs ${afternoonCommits} afternoon`,
        threshold: "Night > Afternoon",
        isSatisfied: nightCommits > afternoonCommits,
      },
      {
        criterion: "Sample size",
        actualValue: `${totalCommits} commits`,
        threshold: "≥ 25 commits",
        isSatisfied: totalCommits >= 25,
      },
    ],
  });

  // 3. MORNING SKYLARK (Concentration during early morning hours)
  const isMorning = totalCommits >= 25 && morningPct >= 30 && morningCommits >= 10 && morningCommits > eveningCommits;
  classifications.push({
    id: "morning-skylark",
    title: "MORNING SKYLARK",
    tagline: "Concentration of activity during early morning hours.",
    description: `A large portion of your commit timestamps are recorded between 05:00 and 11:59 ${tzAbbr}.`,
    badgeAccent: "#38BDF8",
    evidenceStrength: getStrength(totalCommits, morningPct - 30),
    evidence: [
      {
        criterion: `Morning commit share (05:00 - 11:59 ${tzAbbr})`,
        actualValue: `${morningPct}% (${morningCommits} commits)`,
        threshold: "≥ 30%",
        isSatisfied: morningPct >= 30,
      },
      {
        criterion: "Morning volume vs evening volume",
        actualValue: `${morningCommits} morning vs ${eveningCommits} evening`,
        threshold: "Morning > Evening",
        isSatisfied: morningCommits > eveningCommits,
      },
      {
        criterion: "Sample size",
        actualValue: `${totalCommits} commits`,
        threshold: "≥ 25 commits",
        isSatisfied: totalCommits >= 25,
      },
    ],
  });

  // 4. WEEKEND WARRIOR
  const isWeekendWarrior = weekendPct >= 35 && weekendCommits >= 10 && totalCommits >= 25;
  classifications.push({
    id: "weekend-warrior",
    title: "WEEKEND WARRIOR",
    tagline: "Elevated activity recorded on Saturdays and Sundays.",
    description: "A notable proportion of your commit activity is deployed on weekend days relative to the weekly baseline.",
    badgeAccent: "#FFDC58",
    evidenceStrength: getStrength(totalCommits, weekendPct - 35),
    evidence: [
      {
        criterion: "Weekend commit percentage (Saturday & Sunday)",
        actualValue: `${weekendPct}% (${weekendCommits} commits)`,
        threshold: "≥ 35%",
        isSatisfied: weekendPct >= 35,
      },
      {
        criterion: "Sample size",
        actualValue: `${totalCommits} commits`,
        threshold: "≥ 25 commits",
        isSatisfied: totalCommits >= 25,
      },
    ],
  });

  // 5. WEEKDAY OPERATOR
  const isWeekday = weekdayPct >= 90 && weekdayCommits >= 25 && totalCommits >= 30;
  classifications.push({
    id: "weekday-operator",
    title: "WEEKDAY OPERATOR",
    tagline: "Activity concentrated almost exclusively during standard weekdays.",
    description: "Almost all of your engineering output occurs Monday through Friday with minimal weekend activity.",
    badgeAccent: "#34D399",
    evidenceStrength: getStrength(totalCommits, weekdayPct - 90),
    evidence: [
      {
        criterion: "Weekday commit percentage (Monday - Friday)",
        actualValue: `${weekdayPct}% (${weekdayCommits} commits)`,
        threshold: "≥ 90%",
        isSatisfied: weekdayPct >= 90,
      },
      {
        criterion: "Sample size",
        actualValue: `${totalCommits} commits`,
        threshold: "≥ 30 commits",
        isSatisfied: totalCommits >= 30,
      },
    ],
  });

  // 6. ATOMIC COMMITTER
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

  // 7. BATCH DEPLOYER
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

  // 8. CONVENTIONAL DISCIPLINE
  const conventionalCount = commitForensics.conventionalCommitCount || 0;
  const conventionalPercentage = totalCommits > 0 ? Math.round((conventionalCount / totalCommits) * 100) : 0;
  const isConventional = conventionalPercentage >= 70 && conventionalCount >= 15 && totalCommits >= 25;
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
        actualValue: `${conventionalPercentage}% (${conventionalCount} commits)`,
        threshold: "≥ 70%",
        isSatisfied: conventionalPercentage >= 70 && conventionalCount >= 15,
      },
      {
        criterion: "Sample size",
        actualValue: `${totalCommits} commits`,
        threshold: "≥ 25 commits",
        isSatisfied: totalCommits >= 25,
      },
    ],
  });

  // 9. REFACTOR MACHINE
  const isRefactor = churn.churnRatio >= 0.4 && churn.totalDeletions >= 500 && totalCommits >= 25;
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
      {
        criterion: "Sample size",
        actualValue: `${totalCommits} commits`,
        threshold: "≥ 25 commits",
        isSatisfied: totalCommits >= 25,
      },
    ],
  });

  // 10. ONE-PROJECT SPECIALIST (Requires at least 2 repos to represent genuine focus choice)
  const sortedRepos = [...repositories].sort((a, b) => b.commitCount - a.commitCount);
  const topRepo = sortedRepos[0];
  const topRepoCommits = topRepo?.commitCount || 0;
  const topRepoRatio = totalCommits > 0 ? Math.round((topRepoCommits / totalCommits) * 100) : 0;
  const isSpecialist = topRepoRatio >= 70 && totalCommits >= 30 && totalRepos >= 2;
  classifications.push({
    id: "one-project-specialist",
    title: "ONE-PROJECT SPECIALIST",
    tagline: "Activity concentrated in a single primary repository.",
    description: "The overwhelming majority of your logged engineering commits are concentrated in one flagship repository.",
    badgeAccent: "#6BCB77",
    evidenceStrength: getStrength(totalCommits, topRepoRatio - 70),
    evidence: [
      {
        criterion: "Concentration in primary repository",
        actualValue: `${topRepoRatio}% in ${topRepo?.name || "primary repo"}`,
        threshold: "≥ 70%",
        isSatisfied: topRepoRatio >= 70,
      },
      {
        criterion: "Portfolio breadth",
        actualValue: `${totalRepos} repositories`,
        threshold: "≥ 2 repos",
        isSatisfied: totalRepos >= 2,
      },
      {
        criterion: "Sample size",
        actualValue: `${totalCommits} commits`,
        threshold: "≥ 30 commits",
        isSatisfied: totalCommits >= 30,
      },
    ],
  });

  // 11. ECOSYSTEM EXPLORER
  const isExplorer = totalRepos >= 6 && topRepoRatio <= 35 && totalCommits >= 35;
  classifications.push({
    id: "ecosystem-explorer",
    title: "ECOSYSTEM EXPLORER",
    tagline: "Maintains an evenly distributed multi-repository portfolio.",
    description: "Your commit activity is spread across numerous repositories without any single codebase dominating.",
    badgeAccent: "#A78BFA",
    evidenceStrength: getStrength(totalCommits, 35 - topRepoRatio),
    evidence: [
      {
        criterion: "Total accessible repositories",
        actualValue: `${totalRepos} repos`,
        threshold: "≥ 6 repos",
        isSatisfied: totalRepos >= 6,
      },
      {
        criterion: "Maximum single-repository share",
        actualValue: `${topRepoRatio}%`,
        threshold: "≤ 35%",
        isSatisfied: topRepoRatio <= 35,
      },
      {
        criterion: "Sample size",
        actualValue: `${totalCommits} commits`,
        threshold: "≥ 35 commits",
        isSatisfied: totalCommits >= 35,
      },
    ],
  });

  // 12. REPOSITORY HOARDER
  const quietRepos = repositories.filter((r) => r.commitCount <= 2).length;
  const quietRatio = totalRepos > 0 ? Math.round((quietRepos / totalRepos) * 100) : 0;
  const isHoarder = totalRepos >= 10 && quietRatio >= 50 && quietRepos >= 5;
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
        threshold: "≥ 10 repos",
        isSatisfied: totalRepos >= 10,
      },
      {
        criterion: "Percentage with ≤ 2 commits",
        actualValue: `${quietRatio}% (${quietRepos} repos)`,
        threshold: "≥ 50% (min 5 repos)",
        isSatisfied: quietRatio >= 50 && quietRepos >= 5,
      },
    ],
  });

  // 13. STEADY BUILDER
  const hasAllWeekdays = temporal.byWeekday.length === 7 && temporal.byWeekday.every((c) => c > 0);
  const isSteady = summary.longestStreakDays >= 7 && hasAllWeekdays && totalCommits >= 30;
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
      {
        criterion: "Sample size",
        actualValue: `${totalCommits} commits`,
        threshold: "≥ 30 commits",
        isSatisfied: totalCommits >= 30,
      },
    ],
  });

  // 14. FIX ADDICT
  const fixCategory = commitCategories.find((c) => c.category === "FIX");
  const fixPercentage = fixCategory ? fixCategory.percentage : 0;
  const fixCount = fixCategory ? fixCategory.count : 0;
  const isFixAddict = fixPercentage >= 20 && fixCount >= 5 && totalCommits >= 25;
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
        actualValue: `${fixPercentage}% (${fixCount} commits)`,
        threshold: "≥ 20% (min 5 commits)",
        isSatisfied: fixPercentage >= 20 && fixCount >= 5,
      },
      {
        criterion: "Sample size",
        actualValue: `${totalCommits} commits`,
        threshold: "≥ 25 commits",
        isSatisfied: totalCommits >= 25,
      },
    ],
  });

  // 15. WIP SPECIALIST
  const wipCategory = commitCategories.find((c) => c.category === "WIP");
  const wipPercentage = wipCategory ? wipCategory.percentage : 0;
  const wipCount = wipCategory ? wipCategory.count : 0;
  const isWipSpecialist = wipPercentage >= 6 && wipCount >= 3 && totalCommits >= 25;
  classifications.push({
    id: "wip-specialist",
    title: "WIP SPECIALIST",
    tagline: "Frequently commits work-in-progress snapshots.",
    description: "A noticeable proportion of your commit messages are labeled as 'wip' or temporary checkpoints.",
    badgeAccent: "#F59E0B",
    evidenceStrength: getStrength(totalCommits, wipPercentage - 6),
    evidence: [
      {
        criterion: "Percentage of commits labeled 'WIP'",
        actualValue: `${wipPercentage}% (${wipCount} commits)`,
        threshold: "≥ 6% (min 3 commits)",
        isSatisfied: wipPercentage >= 6 && wipCount >= 3,
      },
      {
        criterion: "Sample size",
        actualValue: `${totalCommits} commits`,
        threshold: "≥ 25 commits",
        isSatisfied: totalCommits >= 25,
      },
    ],
  });

  // 16. MESSAGE MINIMALIST
  const isMinimalist =
    commitForensics.averageMessageLength < 15 &&
    commitForensics.averageMessageLength > 0 &&
    commitForensics.shortMessageCount >= 8 &&
    totalCommits >= 25;
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
        criterion: "Short commit messages count (< 10 chars)",
        actualValue: `${commitForensics.shortMessageCount} commits`,
        threshold: "≥ 8 commits",
        isSatisfied: commitForensics.shortMessageCount >= 8,
      },
      {
        criterion: "Sample size",
        actualValue: `${totalCommits} commits`,
        threshold: "≥ 25 commits",
        isSatisfied: totalCommits >= 25,
      },
    ],
  });

  // 17. POLYGLOT INVESTIGATOR
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

  // 18. MARATHON SPRINTER (High single-day burst capacity)
  const peakDayCommits = summary.peakDailyCommits || temporal.peakDailyCommits || 0;
  const isSprinter = peakDayCommits >= 15 && totalCommits >= 40;
  classifications.push({
    id: "marathon-sprinter",
    title: "MARATHON SPRINTER",
    tagline: "Capable of massive single-day deployment surges.",
    description: "Your commit history records intense bursts of development activity concentrated within single calendar days.",
    badgeAccent: "#EC4899",
    evidenceStrength: getStrength(totalCommits, peakDayCommits - 15),
    evidence: [
      {
        criterion: "Peak single-day commit burst",
        actualValue: `${peakDayCommits} commits`,
        threshold: "≥ 15 commits/day",
        isSatisfied: peakDayCommits >= 15,
      },
      {
        criterion: "Sample size",
        actualValue: `${totalCommits} commits`,
        threshold: "≥ 40 commits",
        isSatisfied: totalCommits >= 40,
      },
    ],
  });

  // Sort satisfied classifications first, then by evidence strength
  return classifications.sort((a, b) => {
    const aSatisfied = a.evidence.every((e) => e.isSatisfied) ? 1 : 0;
    const bSatisfied = b.evidence.every((e) => e.isSatisfied) ? 1 : 0;
    if (bSatisfied !== aSatisfied) {
      return bSatisfied - aSatisfied;
    }
    const rank: Record<DeveloperClassification["evidenceStrength"], number> = {
      "VERY HIGH": 4,
      HIGH: 3,
      MODERATE: 2,
      LOW: 1,
    };
    return (rank[b.evidenceStrength] || 0) - (rank[a.evidenceStrength] || 0);
  });
}
