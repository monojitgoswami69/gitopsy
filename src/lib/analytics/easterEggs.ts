/**
 * DETERMINISTIC EASTER EGG DETECTOR
 * Secret discoveries unlocked strictly by verified GitHub metrics or keyboard interactions.
 */

import { DeterministicEasterEgg, GitopsyAnalysis, ForensicCommit } from "@/types/domain";

export function detectDeterministicEasterEggs(
  analysis: Partial<GitopsyAnalysis>,
  commits: ForensicCommit[]
): DeterministicEasterEgg[] {
  const eggs: DeterministicEasterEgg[] = [];
  const summary = analysis.summary;
  const repos = analysis.repositories || [];
  const now = new Date().toISOString();

  // 1. 404 Commits Found
  if (summary && summary.totalCommits === 404) {
    eggs.push({
      id: "egg-404",
      title: "CLASSIFIED: 404 COMMITS FOUND",
      trigger: "Exact match: 404 total commits analyzed",
      unlockedAt: now,
      dialogue: "404 commits found. Unfortunately, they are all yours. The coroner has documented the incident.",
    });
  }

  // 2. The Meaning of Life (42)
  if (
    summary &&
    (summary.totalCommits === 42 ||
      summary.longestStreakDays === 42 ||
      repos.some((r) => r.stars === 42 || r.commitCount === 42))
  ) {
    eggs.push({
      id: "egg-42",
      title: "CLASSIFIED: THE ANSWER TO LIFE & GITHUB",
      trigger: "A verified metric equaled exactly 42",
      unlockedAt: now,
      dialogue: "42 detected in your forensic record. Deep Thought confirms your commits are mathematically justified.",
    });
  }

  // 3. Nice (69)
  if (summary && (summary.nightCommitPercentage === 69 || repos.some((r) => r.stars === 69 || r.forks === 69))) {
    eggs.push({
      id: "egg-69",
      title: "CLASSIFIED: NICE",
      trigger: "A verified metric equaled 69",
      unlockedAt: now,
      dialogue: "69 detected. Nice. The forensic laboratory respects this statistical milestone.",
    });
  }

  // 4. Blaze It (420)
  if (summary && (summary.totalCommits === 420 || repos.some((r) => r.stars === 420 || r.commitCount === 420))) {
    eggs.push({
      id: "egg-420",
      title: "CLASSIFIED: HIGH VOLTAGE CHURN",
      trigger: "A verified metric equaled 420",
      unlockedAt: now,
      dialogue: "420 detected. High-frequency code emission confirmed.",
    });
  }

  // 5. 1337 Leet Developer
  if (summary && (summary.totalCommits === 1337 || summary.linesAdded === 1337 || summary.linesDeleted === 1337)) {
    eggs.push({
      id: "egg-1337",
      title: "CLASSIFIED: 1337 ELEVATED CLEARANCE",
      trigger: "A verified metric equaled 1337",
      unlockedAt: now,
      dialogue: "1337 detected. Elite terminal authorization granted. All forensic logs cleared.",
    });
  }

  // 6. 3 AM Nocturnal Cult
  const threeAmCommits = commits.filter((c) => c.hour === 3);
  if (threeAmCommits.length >= 3) {
    eggs.push({
      id: "egg-3am",
      title: "CLASSIFIED: 3 AM WITCHING HOUR GUILD",
      trigger: `${threeAmCommits.length} commits pushed between 03:00 and 03:59 UTC`,
      unlockedAt: now,
      dialogue: "Multiple 3 AM commits recorded. Your commit timestamps suggest circadian rebellion.",
    });
  }

  // 7. Local Legend (High output with zero stars/forks)
  const isLocalLegend =
    (summary?.totalCommits || 0) >= 300 &&
    repos.every((r) => r.stars === 0 && r.forks === 0);
  if (isLocalLegend) {
    eggs.push({
      id: "egg-local-legend",
      title: "CLASSIFIED: LOCAL LEGEND",
      trigger: "Over 300 commits across repositories with 0 public stars and 0 forks",
      unlockedAt: now,
      dialogue: "Zero stars, zero forks, hundreds of commits. Pure unadulterated artisanal engineering in isolation.",
    });
  }

  // 8. The Final Final Incident
  const finalCommits = commits.filter((c) => {
    const m = c.message.toLowerCase();
    return m.includes("final final") || m.includes("really final") || m.includes("final v2") || m.includes("final-final");
  });
  if (finalCommits.length >= 2) {
    eggs.push({
      id: "egg-final-final",
      title: "CLASSIFIED: THE FINAL_FINAL_V2 INCIDENT",
      trigger: `${finalCommits.length} commits containing variations of 'final final'`,
      unlockedAt: now,
      dialogue: "Multiple commits titled 'final' were subsequently modified. None appear to have been final.",
    });
  }

  return eggs;
}
