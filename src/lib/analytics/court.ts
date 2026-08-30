/**
 * GITOPSY COURT CHARGES ENGINE
 * Generates formal indictments grounded strictly in verified GitHub statistics.
 */

import { CourtCharge, GitopsyAnalysis, ForensicCommit } from "@/types/domain";

export function generateCourtCharges(
  analysis: Partial<GitopsyAnalysis>,
  defendantLogin: string,
  commits?: ForensicCommit[]
): CourtCharge[] {
  const charges: CourtCharge[] = [];
  const summary = analysis.summary;
  const churn = analysis.commitForensics;
  if (!summary) return charges;
  const tzAbbr = summary.timezoneAbbr || "local";

  // Charge 1: Nocturnal Malpractice
  if (summary.nightCommitPercentage >= 35 && summary.totalCommits >= 20) {
    charges.push({
      id: "charge-night",
      chargeTitle: "COUNT 1: NOCTURNAL ACTIVITY",
      allegation: `Defendant @${defendantLogin} stands accused of committing software during late-night hours.`,
      evidence: `${summary.nightCommitPercentage}% of analyzed commits were timestamped between 21:00 and 04:59 ${tzAbbr} (Peak hour: ${summary.busiestHour}:00 ${tzAbbr}).`,
      verdict: "GUILTY AS CHARGED",
      sentence: "Mandatory prescription of one functional circadian rhythm.",
    });
  }

  // Charge 2: Unlawful Arson of Legacy Code
  if (churn && churn.churnRatio >= 0.4 && summary.linesDeleted >= 500) {
    charges.push({
      id: "charge-incineration",
      chargeTitle: "COUNT 2: HIGH-VOLUME CODE DELETION",
      allegation: `Defendant @${defendantLogin} demonstrated substantial code subtraction across history.`,
      evidence: `${summary.linesDeleted.toLocaleString()} lines deleted across commits, yielding a ${Math.round(churn.churnRatio * 100)}% deletion-to-churn ratio.`,
      verdict: "GUILTY AS CHARGED",
      sentence: "Sentenced to maintain legacy jQuery repositories for 30 days.",
    });
  }

  // Charge 3: WIP Spammer
  const wipCategory = churn?.messageCategories.find((c) => c.category === "WIP");
  if (wipCategory && wipCategory.count >= 3) {
    charges.push({
      id: "charge-wip",
      chargeTitle: "COUNT 3: WORK-IN-PROGRESS METADATA PROLIFERATION",
      allegation: `Defendant repeatedly utilized 'wip' or temporary checkpoint descriptions in commit messages.`,
      evidence: `${wipCategory.count} commit messages were explicitly titled 'wip' or 'work in progress'.`,
      verdict: "GUILTY AS CHARGED",
      sentence: "Must write 50-word descriptive changelogs before future merges.",
    });
  }

  // Charge 4: Weekend Labor Law Violations
  if (summary.weekendCommitPercentage >= 35 && summary.totalCommits >= 20) {
    charges.push({
      id: "charge-weekend",
      chargeTitle: "COUNT 4: WEEKEND COMMIT LOGGING",
      allegation: `Defendant deployed code on Saturdays and Sundays in excess of standard baselines.`,
      evidence: `${summary.weekendCommitPercentage}% of commits occurred during Saturday or Sunday.`,
      verdict: "GUILTY AS CHARGED",
      sentence: "Ordered to touch grass for a minimum of 45 consecutive minutes.",
    });
  }

  // Charge 5: Perjury in Commit Finality (from consolidated easter egg)
  const finalCommits = (commits || []).filter((c) => {
    const m = (c.message || "").toLowerCase();
    return (
      m.includes("final final") ||
      m.includes("really final") ||
      m.includes("final v2") ||
      m.includes("final-final") ||
      m.includes("final version")
    );
  });
  if (finalCommits.length >= 2) {
    charges.push({
      id: "charge-false-finality",
      chargeTitle: `COUNT ${charges.length + 1}: FALSE DECLARATIONS OF FINALITY`,
      allegation: `Defendant repeatedly declared code branches and commits as 'final' before proceeding with subsequent revisions.`,
      evidence: `${finalCommits.length} commits were titled variations of 'final final' or 'really final'.`,
      verdict: "GUILTY AS CHARGED",
      sentence: "Banned from naming any branch or commit 'final' indefinitely.",
    });
  }

  // Fallback charge if defendant is well-behaved
  if (charges.length === 0) {
    charges.push({
      id: "charge-clean",
      chargeTitle: "COUNT 1: HYGIENIC GIT DISCIPLINE",
      allegation: `Defendant exhibits orderly commit habits with balanced hours and structured messages.`,
      evidence: `${summary.totalCommits} commits analyzed with no extreme nocturnal, weekend, or WIP outliers detected.`,
      verdict: "ACQUITTED ON TECHNICALITY",
      sentence: "Released on good behavior. The court remains observant.",
    });
  }

  return charges;
}
