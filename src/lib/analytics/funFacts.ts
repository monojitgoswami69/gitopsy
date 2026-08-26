/**
 * DETERMINISTIC FINDINGS ENGINE
 * Generates verified analytical findings derived strictly from GitHub metrics.
 */

import { DeterministicFinding, GitopsyAnalysis } from "@/types/domain";

export function generateDeterministicFindings(
  analysis: Partial<GitopsyAnalysis>
): DeterministicFinding[] {
  const findings: DeterministicFinding[] = [];
  const summary = analysis.summary;
  if (!summary) return findings;

  // 1. Peak Cadence
  if (summary.busiestWeekday && summary.busiestWeekday !== "N/A") {
    findings.push({
      id: "finding-weekday",
      icon: "📅",
      title: `Peak Weekly Cadence: ${summary.busiestWeekday}`,
      evidence: `More commits deployed on ${summary.busiestWeekday}s than any other day of the week.`,
      category: "TEMPORAL",
    });
  }

  // 2. Churn Ratio
  if (summary.linesDeleted > 0) {
    const ratio = Math.round((summary.linesAdded / summary.linesDeleted) * 10) / 10;
    findings.push({
      id: "finding-ratio",
      icon: "⚖️",
      title: `Addition to Deletion Ratio: ${ratio}x`,
      evidence: `${summary.linesAdded.toLocaleString()} additions vs ${summary.linesDeleted.toLocaleString()} deletions.`,
      category: "CHURN",
    });
  }

  // 3. Inactivity Hiatus
  if (summary.longestInactiveGapDays && summary.longestInactiveGapDays >= 14) {
    findings.push({
      id: "finding-hiatus",
      icon: "⏸️",
      title: `Longest Hiatus: ${summary.longestInactiveGapDays} Days`,
      evidence: `The longest observed break between consecutive commits was ${summary.longestInactiveGapDays} days.`,
      category: "TEMPORAL",
    });
  }

  // 4. Peak Daily Velocity
  if (summary.peakDailyCommits && summary.peakDailyCommits >= 5) {
    findings.push({
      id: "finding-peak-day",
      icon: "🚀",
      title: `Peak Single-Day Output: ${summary.peakDailyCommits} Commits`,
      evidence: `Highest single-day commit burst recorded in the analysis window.`,
      category: "TEMPORAL",
    });
  }

  // 5. Daily Density
  if (summary.averageDailyCommits && summary.averageDailyCommits > 0) {
    findings.push({
      id: "finding-density",
      icon: "📊",
      title: `Daily Density: ${summary.averageDailyCommits} Commits/Active Day`,
      evidence: `Averaged across ${summary.totalActiveDays} distinct active calendar days.`,
      category: "BEHAVIOR",
    });
  }

  // 6. Concentration in primary repo
  if (analysis.repositories && analysis.repositories.length > 0 && summary.totalCommits > 0) {
    const sorted = [...analysis.repositories].sort((a, b) => b.commitCount - a.commitCount);
    const topRepo = sorted[0];
    const percentage = Math.round((topRepo.commitCount / summary.totalCommits) * 100);
    findings.push({
      id: "finding-concentration",
      icon: "🎯",
      title: `Portfolio Concentration: ${percentage}% in ${topRepo.name}`,
      evidence: `${topRepo.commitCount.toLocaleString()} out of ${summary.totalCommits.toLocaleString()} commits live in your primary repository.`,
      category: "BEHAVIOR",
    });
  }

  // 7. Languages touched
  if (analysis.languages && analysis.languages.length > 0) {
    findings.push({
      id: "finding-languages",
      icon: "🌐",
      title: `Language Footprint: ${analysis.languages.length} Dialects`,
      evidence: `Primary dialect: ${analysis.languages[0].name} (${analysis.languages[0].percentage}% of total bytes).`,
      category: "LANGUAGES",
    });
  }

  // 8. Streak
  if (summary.longestStreakDays > 1) {
    findings.push({
      id: "finding-streak",
      icon: "🔥",
      title: `Longest Streak: ${summary.longestStreakDays} Consecutive Days`,
      evidence: `Active daily commit timestamps across ${summary.longestStreakDays} uninterrupted days.`,
      category: "TEMPORAL",
    });
  }

  // 9. Merge Rate
  if (summary.mergeRatePercentage !== null && summary.prsAuthored > 0) {
    findings.push({
      id: "finding-merge-rate",
      icon: "🔀",
      title: `PR Merge Completion: ${summary.mergeRatePercentage}%`,
      evidence: `${summary.prsMerged.toLocaleString()} of ${summary.prsAuthored.toLocaleString()} pull requests were merged into target branches.`,
      category: "COLLABORATION",
    });
  }

  return findings;
}
