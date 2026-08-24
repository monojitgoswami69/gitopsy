/**
 * DETERMINISTIC DEVELOPER CLASSIFICATIONS ENGINE
 * Every classification is calculated strictly from verified thresholds with transparent evidence strength.
 */

import { DeveloperClassification, ForensicCommit, RepositoryAnalysis } from "@/types/domain";
import { TemporalActivity } from "@/types/domain";

export interface ClassificationContext {
  commits: ForensicCommit[];
  repositories: RepositoryAnalysis[];
  temporal: TemporalActivity;
  summary: {
    totalCommits: number;
    nightCommitPercentage: number;
    weekendCommitPercentage: number;
    longestStreakDays: number;
    busiestHour: number;
    busiestWeekday: string;
  };
  churn: {
    churnRatio: number;
    totalDeletions: number;
    totalAdditions: number;
  };
  languageCount: number;
  commitCategories: { category: string; count: number; percentage: number }[];
}

export function computeDeveloperClassifications(ctx: ClassificationContext): DeveloperClassification[] {
  const { commits, repositories, temporal, summary, churn, languageCount, commitCategories } = ctx;
  const totalCommits = Math.max(1, summary.totalCommits);
  const totalRepos = Math.max(1, repositories.length);

  const classifications: DeveloperClassification[] = [];

  // Helper to calculate evidence strength
  function getStrength(sampleSize: number, margin: number): DeveloperClassification["evidenceStrength"] {
    if (sampleSize < 10) return "LOW";
    if (sampleSize < 50 || margin < 5) return "MODERATE";
    if (margin < 20) return "HIGH";
    return "VERY HIGH";
  }

  // 1. NIGHT OWL BUILDER
  // Threshold: >= 35% of commits between 21:00 and 04:00 UTC
  const nightOwlThreshold = 35;
  const nightOwlMargin = summary.nightCommitPercentage - nightOwlThreshold;
  const isNightOwl = summary.nightCommitPercentage >= nightOwlThreshold;
  classifications.push({
    id: "night-owl-builder",
    title: "NIGHT OWL BUILDER",
    tagline: "Your Git history appears to have declared war on normal sleep schedules.",
    description: "A substantial percentage of your engineering output occurs between 9:00 PM and 4:00 AM UTC.",
    badgeAccent: "#C084FC",
    evidenceStrength: getStrength(totalCommits, nightOwlMargin),
    evidence: [
      {
        criterion: "Late-night commit percentage (21:00 - 04:00 UTC)",
        actualValue: `${summary.nightCommitPercentage}%`,
        threshold: "≥ 35%",
        isSatisfied: isNightOwl,
      },
      {
        criterion: "Peak activity hour",
        actualValue: `${summary.busiestHour}:00 UTC`,
        threshold: "≥ 21:00 or ≤ 04:00",
        isSatisfied: summary.busiestHour >= 21 || summary.busiestHour <= 4,
      },
    ],
  });

  // 2. WEEKEND WARRIOR
  // Threshold: >= 30% of commits on Saturday or Sunday
  const weekendThreshold = 30;
  const weekendMargin = summary.weekendCommitPercentage - weekendThreshold;
  const isWeekendWarrior = summary.weekendCommitPercentage >= weekendThreshold;
  classifications.push({
    id: "weekend-warrior",
    title: "WEEKEND WARRIOR",
    tagline: "Treats Saturday and Sunday as uninterrupted build windows.",
    description: "A large portion of your commits are deployed when standard offices are closed.",
    badgeAccent: "#FFDC58",
    evidenceStrength: getStrength(totalCommits, weekendMargin),
    evidence: [
      {
        criterion: "Weekend commit percentage (Saturday & Sunday)",
        actualValue: `${summary.weekendCommitPercentage}%`,
        threshold: "≥ 30%",
        isSatisfied: isWeekendWarrior,
      },
      {
        criterion: "Busiest weekday",
        actualValue: summary.busiestWeekday,
        threshold: "Saturday or Sunday",
        isSatisfied: summary.busiestWeekday === "Saturday" || summary.busiestWeekday === "Sunday",
      },
    ],
  });

  // 3. POLYGLOT INVESTIGATOR
  // Threshold: >= 4 distinct programming languages
  const isPolyglot = languageCount >= 4;
  classifications.push({
    id: "polyglot-investigator",
    title: "POLYGLOT INVESTIGATOR",
    tagline: "Fluidly shifts between multiple programming languages.",
    description: "GitHub reports active codebase bytes across four or more distinct language dialects.",
    badgeAccent: "#4D96FF",
    evidenceStrength: getStrength(languageCount * 10, (languageCount - 4) * 20),
    evidence: [
      {
        criterion: "Distinct detected languages with reported bytes",
        actualValue: `${languageCount} languages`,
        threshold: "≥ 4 languages",
        isSatisfied: isPolyglot,
      },
    ],
  });

  // 4. REFACTOR MACHINE / MASS DELETER
  // Threshold: Deletion ratio >= 0.40 and total deletions >= 500 lines
  const isRefactor = churn.churnRatio >= 0.4 && churn.totalDeletions >= 500;
  classifications.push({
    id: "refactor-machine",
    title: "REFACTOR MACHINE",
    tagline: "Demonstrates exceptional willingness to delete and prune code.",
    description: "Your deletion-to-addition ratio shows a high commitment to code subtraction and legacy pruning.",
    badgeAccent: "#FF6B6B",
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

  // 5. ONE-PROJECT SPECIALIST
  // Threshold: >= 60% of all activity concentrated in a single repository
  const sortedRepos = [...repositories].sort((a, b) => b.commitCount - a.commitCount);
  const topRepo = sortedRepos[0];
  const topRepoCommits = topRepo?.commitCount || 0;
  const topRepoRatio = Math.round((topRepoCommits / totalCommits) * 100);
  const isSpecialist = topRepoRatio >= 60 && totalCommits >= 15;
  classifications.push({
    id: "one-project-specialist",
    title: "ONE-PROJECT SPECIALIST",
    tagline: "Hyper-focused on a single primary digital artifact.",
    description: "The majority of your logged engineering commits are concentrated in one flagship repository.",
    badgeAccent: "#6BCB77",
    evidenceStrength: getStrength(totalCommits, topRepoRatio - 60),
    evidence: [
      {
        criterion: "Concentration in primary repository",
        actualValue: `${topRepoRatio}% in ${topRepo?.name || "primary repo"}`,
        threshold: "≥ 60%",
        isSatisfied: isSpecialist,
      },
      {
        criterion: "Total commits in primary repository",
        actualValue: `${topRepoCommits} commits`,
        threshold: "≥ 15 commits",
        isSatisfied: topRepoCommits >= 15,
      },
    ],
  });

  // 6. REPOSITORY HOARDER
  // Threshold: >= 10 repositories with >= 50% having <= 2 commits
  const quietRepos = repositories.filter((r) => r.commitCount <= 2).length;
  const quietRatio = Math.round((quietRepos / totalRepos) * 100);
  const isHoarder = totalRepos >= 10 && quietRatio >= 50;
  classifications.push({
    id: "repository-hoarder",
    title: "REPOSITORY HOARDER",
    tagline: "Possesses a large collection of abandoned digital starter kits.",
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
        threshold: "≥ 50%",
        isSatisfied: quietRatio >= 50,
      },
    ],
  });

  // 7. STEADY BUILDER
  // Threshold: Streak >= 7 days and activity spread across all weekdays
  const hasAllWeekdays = temporal.byWeekday.every((c) => c > 0);
  const isSteady = summary.longestStreakDays >= 7 && hasAllWeekdays;
  classifications.push({
    id: "steady-builder",
    title: "STEADY BUILDER",
    tagline: "Exhibits consistent day-over-day cadence without long dormant gaps.",
    description: "You maintain regular coding streaks across all seven days of the week.",
    badgeAccent: "#4D96FF",
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

  // 8. FIX ADDICT
  // Threshold: >= 20% of commit messages contain fix-related terms
  const fixCategory = commitCategories.find((c) => c.category === "FIX");
  const fixPercentage = fixCategory ? fixCategory.percentage : 0;
  const isFixAddict = fixPercentage >= 20;
  classifications.push({
    id: "fix-addict",
    title: "FIX ADDICT",
    tagline: "Your commit history suggests creation was immediately followed by correction.",
    description: "An unusually high percentage of commit messages explicitly declare bug fixes and patches.",
    badgeAccent: "#FF6B6B",
    evidenceStrength: getStrength(totalCommits, fixPercentage - 20),
    evidence: [
      {
        criterion: "Percentage of commits containing 'fix' terminology",
        actualValue: `${fixPercentage}%`,
        threshold: "≥ 20%",
        isSatisfied: isFixAddict,
      },
    ],
  });

  // 9. WIP SPECIALIST
  // Threshold: >= 5% of commits labeled 'wip' or 'work in progress'
  const wipCategory = commitCategories.find((c) => c.category === "WIP");
  const wipPercentage = wipCategory ? wipCategory.percentage : 0;
  const isWipSpecialist = wipPercentage >= 5;
  classifications.push({
    id: "wip-specialist",
    title: "WIP SPECIALIST",
    tagline: "Believes git push is the ultimate temporary clipboard.",
    description: "A noticeable proportion of your commit messages are labeled simply as 'wip'.",
    badgeAccent: "#FD9745",
    evidenceStrength: getStrength(totalCommits, wipPercentage - 5),
    evidence: [
      {
        criterion: "Percentage of commits labeled 'WIP'",
        actualValue: `${wipPercentage}%`,
        threshold: "≥ 5%",
        isSatisfied: isWipSpecialist,
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
