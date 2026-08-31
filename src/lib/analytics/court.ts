/**
 * GITOPSY COURT CHARGES ENGINE
 * Generates formal satirized indictments grounded strictly in verified GitHub statistics.
 */

import { CourtCharge, GitopsyAnalysis, ForensicCommit } from "@/types/domain";

interface RawCharge {
  id: string;
  rawTitle: string;
  allegation: string;
  evidence: string;
  verdict: "GUILTY AS CHARGED" | "ACQUITTED ON TECHNICALITY" | "PROBATION";
  sentence: string;
}

export function generateCourtCharges(
  analysis: Partial<GitopsyAnalysis>,
  defendantLogin: string,
  commits?: ForensicCommit[]
): CourtCharge[] {
  const rawCharges: RawCharge[] = [];
  const summary = analysis.summary;
  const churn = analysis.commitForensics;
  if (!summary) return [];

  const totalCommits = Math.max(0, summary.totalCommits || 0);
  const tzAbbr = summary.timezoneAbbr || "local";

  // Charge 1: Nocturnal Malpractice
  if (summary.nightCommitPercentage >= 35 && totalCommits >= 20) {
    rawCharges.push({
      id: "charge-night",
      rawTitle: "NOCTURNAL SOFTWARE CONTEMPT",
      allegation: `Defendant @${defendantLogin} stands accused of committing software during ungodly late-night hours.`,
      evidence: `${summary.nightCommitPercentage}% of analyzed commits were timestamped between 21:00 and 04:59 ${tzAbbr} (Peak nocturnal hour: ${summary.busiestHour}:00 ${tzAbbr}).`,
      verdict: "GUILTY AS CHARGED",
      sentence: "Sentenced to one legally mandated sunrise. Appeals may be filed after 06:00.",
    });
  }

  // Charge 2: Unlawful Arson of Legacy Code
  if (churn && churn.churnRatio >= 0.4 && summary.linesDeleted >= 500) {
    rawCharges.push({
      id: "charge-incineration",
      rawTitle: "UNLAWFUL CODE ARSON & INCINERATION",
      allegation: `Defendant @${defendantLogin} demonstrated aggressive code subtraction across version history.`,
      evidence: `${summary.linesDeleted.toLocaleString()} lines deleted across commits, yielding a ${Math.round(churn.churnRatio * 100)}% deletion-to-churn ratio.`,
      verdict: "GUILTY AS CHARGED",
      sentence: "Ordered to explain every deleted line to a rubber duck. The duck may request written clarification.",
    });
  }

  // Charge 3: WIP Spammer
  const wipCategory = churn?.messageCategories.find((c) => c.category === "WIP");
  if (wipCategory && wipCategory.count >= 3) {
    rawCharges.push({
      id: "charge-wip",
      rawTitle: "WORK-IN-PROGRESS RECKLESSNESS",
      allegation: `Defendant repeatedly dumped unverified 'wip' or temporary checkpoint descriptions into repository history.`,
      evidence: `${wipCategory.count} commit messages were explicitly titled 'wip' or 'work in progress'.`,
      verdict: "GUILTY AS CHARGED",
      sentence: "Ordered to write one commit message containing enough descriptive information for another human being to understand what happened.",
    });
  }

  // Charge 4: Weekend Labor Violations
  if (summary.weekendCommitPercentage >= 35 && totalCommits >= 20) {
    rawCharges.push({
      id: "charge-weekend",
      rawTitle: "WEEKEND OVERTIME CONTEMPT",
      allegation: `Defendant deployed code on Saturdays and Sundays in flagrant disregard of standard rest baselines.`,
      evidence: `${summary.weekendCommitPercentage}% of commits occurred during Saturday or Sunday.`,
      verdict: "GUILTY AS CHARGED",
      sentence: "Sentenced to 45 minutes of touching grass. GitHub access strictly prohibited during sentence duration.",
    });
  }

  // Charge 5: Perjury in Commit Finality
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
    rawCharges.push({
      id: "charge-false-finality",
      rawTitle: "PERJURY IN COMMIT FINALITY",
      allegation: `Defendant repeatedly declared commits as 'final' before proceeding with subsequent revisions.`,
      evidence: `${finalCommits.length} commits were titled variations of 'final final' or 'really final'.`,
      verdict: "GUILTY AS CHARGED",
      sentence: "All future commits and branches containing the word 'final' are hereby confiscated by the court.",
    });
  }

  // Charge 6: Monster Commit Payload
  if (churn?.largestCommit && (churn.largestCommit.additions + churn.largestCommit.deletions) >= 2000) {
    const lines = churn.largestCommit.additions + churn.largestCommit.deletions;
    rawCharges.push({
      id: "charge-monster-commit",
      rawTitle: "PAYLOAD MASS TRANSGRESSION",
      allegation: `Defendant shoved a colossal atomic blast radius into a single commit payload.`,
      evidence: `Single commit (${churn.largestCommit.sha.slice(0, 7)}) churned ${lines.toLocaleString()} lines across ${churn.largestCommit.filesChanged} file(s).`,
      verdict: "GUILTY AS CHARGED",
      sentence: "Sentenced to review 10 consecutive 5,000-line merge conflicts without syntax highlighting.",
    });
  }

  // Charge 7: Criminal Message Brevity
  if (churn && churn.averageMessageLength < 8 && churn.averageMessageLength > 0 && churn.shortMessageCount >= 6) {
    rawCharges.push({
      id: "charge-brevity",
      rawTitle: "CRIMINAL MESSAGE BREVITY",
      allegation: `Defendant repeatedly published shorthand, cryptic commit log entries lacking discernible semantic context.`,
      evidence: `Average commit message length was only ${churn.averageMessageLength} characters with ${churn.shortMessageCount} micro-messages logged.`,
      verdict: "GUILTY AS CHARGED",
      sentence: "Must append a 30-word explanatory haiku to every commit message for the next 14 business days.",
    });
  }

  // Fallback charge if defendant is well-behaved
  if (rawCharges.length === 0) {
    return [
      {
        id: "charge-clean",
        chargeTitle: "COUNT 1: HYGIENIC GIT DISCIPLINE",
        allegation: `Defendant @${defendantLogin} exhibits orderly commit habits with balanced hours and structured messages.`,
        evidence: `${totalCommits} commits analyzed with no extreme nocturnal, weekend, brevity, or WIP violations detected.`,
        verdict: "ACQUITTED ON TECHNICALITY",
        sentence: "Released on good behavior. The court remains observant.",
      },
    ];
  }

  // Assign sequential dynamic count numbering
  return rawCharges.map((c, index) => ({
    id: c.id,
    chargeTitle: `COUNT ${index + 1}: ${c.rawTitle}`,
    allegation: c.allegation,
    evidence: c.evidence,
    verdict: c.verdict,
    sentence: c.sentence,
  }));
}
