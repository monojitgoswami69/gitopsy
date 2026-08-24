/**
 * GITOPSY COURT CHARGES ENGINE
 * Generates comedic formal indictments grounded strictly in verified GitHub statistics.
 */

import { CourtCharge, GitopsyAnalysis } from "@/types/domain";

export function generateCourtCharges(
  analysis: Partial<GitopsyAnalysis>,
  defendantLogin: string
): CourtCharge[] {
  const charges: CourtCharge[] = [];
  const summary = analysis.summary;
  const churn = analysis.commitForensics;
  if (!summary) return charges;

  // Charge 1: Nocturnal Malpractice
  if (summary.nightCommitPercentage >= 35) {
    charges.push({
      id: "charge-night",
      chargeTitle: "COUNT 1: NOCTURNAL MALPRACTICE",
      allegation: `Defendant @${defendantLogin} stands accused of committing software during hours when sensible biological entities sleep.`,
      evidence: `${summary.nightCommitPercentage}% of analyzed commits were timestamped between 21:00 and 04:00 UTC (Peak hour: ${summary.busiestHour}:00 UTC).`,
      verdict: "GUILTY AS CHARGED",
      sentence: "Mandatory prescription of one functional circadian rhythm.",
    });
  }

  // Charge 2: Incineration of Architecture
  if (churn && churn.churnRatio >= 0.4 && summary.linesDeleted >= 500) {
    charges.push({
      id: "charge-incineration",
      chargeTitle: "COUNT 2: UNLAWFUL ARSON OF LEGACY CODE",
      allegation: `Defendant @${defendantLogin} demonstrated extreme disregard for prior engineering by incinerating large volumes of code.`,
      evidence: `${summary.linesDeleted.toLocaleString()} lines deleted across commits, yielding a ${Math.round(churn.churnRatio * 100)}% deletion-to-churn ratio.`,
      verdict: "GUILTY AS CHARGED",
      sentence: "Sentence: Sentenced to maintain legacy jQuery repositories for 30 days.",
    });
  }
  // Charge 3: WIP Spammer
  const wipCategory = churn?.messageCategories.find((c) => c.category === "WIP");
  if (wipCategory && wipCategory.count >= 3) {
    charges.push({
      id: "charge-wip",
      chargeTitle: "COUNT 3: CONTEMPT OF VERSION CONTROL METADATA",
      allegation: `Defendant repeatedly treated git push as an uncurated temporary clipboard.`,
      evidence: `${wipCategory.count} commit messages were explicitly titled 'wip' or 'work in progress'.`,
      verdict: "GUILTY AS CHARGED",
      sentence: "Sentence: Must write 50-word descriptive changelogs before every future commit.",
    });
  }

  // Charge 4: Weekend Labor Law Violations
  if (summary.weekendCommitPercentage >= 30) {
    charges.push({
      id: "charge-weekend",
      chargeTitle: "COUNT 4: UNLAWFUL WEEKEND ENGINEERING",
      allegation: `Defendant deployed code on Saturdays and Sundays in direct violation of weekend relaxation protocols.`,
      evidence: `${summary.weekendCommitPercentage}% of commits occurred during Saturday or Sunday.`,
      verdict: "GUILTY AS CHARGED",
      sentence: "Sentence: Ordered to touch grass for a minimum of 45 consecutive minutes.",
    });
  }

  // Fallback charge if defendant is suspiciously well-behaved
  if (charges.length === 0) {
    charges.push({
      id: "charge-clean",
      chargeTitle: "COUNT 1: SUSPICIOUSLY HYGIENIC GIT DISCIPLINE",
      allegation: `Defendant exhibits suspiciously orderly commit habits, raising concerns of automated bot activity.`,
      evidence: `${summary.totalCommits} commits analyzed with no egregious nocturnal or message violations detected.`,
      verdict: "ACQUITTED ON TECHNICALITY",
      sentence: "Sentence: Released on good behavior. The court remains skeptical.",
    });
  }

  return charges;
}
