/**
 * DETERMINISTIC FINDINGS ENGINE
 * Generates verified analytical findings derived strictly from GitHub metrics that pass a meaningfulness filter.
 */

import { DeterministicFinding, GitopsyAnalysis } from "@/types/domain";

export function generateDeterministicFindings(
  analysis: Partial<GitopsyAnalysis>
): DeterministicFinding[] {
  const findings: DeterministicFinding[] = [];
  const summary = analysis.summary;
  if (!summary) return findings;

  const totalCommits = Math.max(0, summary.totalCommits || 0);

  // 1. Peak Cadence (Only when there is a valid busy weekday and sufficient commit volume)
  if (summary.busiestWeekday && summary.busiestWeekday !== "N/A" && totalCommits >= 15) {
    findings.push({
      id: "finding-weekday",
      icon: "📅",
      title: `Peak Weekly Cadence: ${summary.busiestWeekday}`,
      evidence: `More commits deployed on ${summary.busiestWeekday}s than any other day of the week.`,
      category: "TEMPORAL",
    });
  }

  // 2. High or Low Churn Ratio (Only when ratio is notable, e.g. >= 4.0x or <= 0.8x)
  if (summary.linesDeleted > 100 && summary.linesAdded > 100) {
    const ratio = Math.round((summary.linesAdded / summary.linesDeleted) * 10) / 10;
    if (ratio >= 4.0 || ratio <= 0.8) {
      findings.push({
        id: "finding-ratio",
        icon: "⚖️",
        title: `Addition to Deletion Ratio: ${ratio}x`,
        evidence: `${summary.linesAdded.toLocaleString()} additions vs ${summary.linesDeleted.toLocaleString()} deletions across history.`,
        category: "CHURN",
      });
    }
  }

  // 3. Meaningful Inactivity Hiatus (>= 21 days)
  if (summary.longestInactiveGapDays && summary.longestInactiveGapDays >= 21) {
    findings.push({
      id: "finding-hiatus",
      icon: "⏸️",
      title: `Longest Hiatus: ${summary.longestInactiveGapDays} Days`,
      evidence: `The longest observed pause between consecutive commits was ${summary.longestInactiveGapDays} calendar days.`,
      category: "TEMPORAL",
    });
  }

  // 4. Peak Daily Velocity Burst (>= 8 commits in a single day)
  if (summary.peakDailyCommits && summary.peakDailyCommits >= 8) {
    findings.push({
      id: "finding-peak-day",
      icon: "🚀",
      title: `Peak Single-Day Output: ${summary.peakDailyCommits} Commits`,
      evidence: `Highest single-day commit burst recorded in the analyzed timeframe.`,
      category: "TEMPORAL",
    });
  }

  // 5. High Daily Density (>= 3.5 commits/active day)
  if (summary.averageDailyCommits && summary.averageDailyCommits >= 3.5 && summary.totalActiveDays >= 5) {
    findings.push({
      id: "finding-density",
      icon: "📊",
      title: `Daily Density: ${summary.averageDailyCommits} Commits/Active Day`,
      evidence: `Averaged across ${summary.totalActiveDays} distinct active calendar days.`,
      category: "BEHAVIOR",
    });
  }

  // 6. Polyglot Language Footprint (>= 3 distinct languages)
  if (analysis.languages && analysis.languages.length >= 3) {
    findings.push({
      id: "finding-languages",
      icon: "🌐",
      title: `Language Footprint: ${analysis.languages.length} Dialects`,
      evidence: `Primary dialect: ${analysis.languages[0].name} (${analysis.languages[0].percentage}% of total bytes).`,
      category: "LANGUAGES",
    });
  }

  // 7. Sustained Streak (>= 5 consecutive days)
  if (summary.longestStreakDays && summary.longestStreakDays >= 5) {
    findings.push({
      id: "finding-streak",
      icon: "🔥",
      title: `Longest Streak: ${summary.longestStreakDays} Consecutive Days`,
      evidence: `Active daily commit timestamps across ${summary.longestStreakDays} uninterrupted days.`,
      category: "TEMPORAL",
    });
  }

  // 8. PR Merge Rate (Only when developer has authored >= 5 PRs)
  if (summary.mergeRatePercentage !== null && summary.prsAuthored >= 5) {
    findings.push({
      id: "finding-merge-rate",
      icon: "🔀",
      title: `PR Merge Completion: ${summary.mergeRatePercentage}%`,
      evidence: `${summary.prsMerged.toLocaleString()} of ${summary.prsAuthored.toLocaleString()} pull requests were merged into target branches.`,
      category: "COLLABORATION",
    });
  }

  // 9. Peak Productivity Hour (Localized context)
  if (summary.busiestHour !== undefined && totalCommits >= 20) {
    const tzAbbr = summary.timezoneAbbr || "local";
    const hourStr = `${String(summary.busiestHour).padStart(2, "0")}:00 ${tzAbbr}`;
    findings.push({
      id: "finding-hourly-peak",
      icon: "⏰",
      title: `Peak Hour of Output: ${hourStr}`,
      evidence: `Most frequent timestamp window recorded across all analyzed repositories.`,
      category: "TEMPORAL",
    });
  }

  return findings;
}
