/**
 * CASE NOTES & SPECIAL FINDINGS DETECTOR
 * Discoveries unlocked strictly by rare numerical milestones or message patterns.
 */

import { DeterministicEasterEgg, GitopsyAnalysis, ForensicCommit } from "@/types/domain";
import { createLocalDateExtractor } from "@/lib/analytics/temporal";

export function detectDeterministicEasterEggs(
  analysis: Partial<GitopsyAnalysis>,
  commits: ForensicCommit[]
): DeterministicEasterEgg[] {
  const eggs: DeterministicEasterEgg[] = [];
  const summary = analysis.summary;
  const repos = analysis.repositories || [];
  const now = new Date().toISOString();
  const tz = summary?.timezone || "UTC";
  const tzAbbr = summary?.timezoneAbbr || "local";
  const extractLocal = createLocalDateExtractor(tz);

  // 1. 404 Commits Found
  if (summary && summary.totalCommits === 404) {
    eggs.push({
      id: "egg-404",
      title: "CASE NOTE: 404 COMMITS RECORDED",
      trigger: "Exact match: 404 total commits analyzed",
      unlockedAt: now,
      dialogue: "404 commits found in the repository logs. All accounted for in the primary examination record.",
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
      title: "CASE NOTE: THE NUMBER 42",
      trigger: "A metric on the record equaled exactly 42",
      unlockedAt: now,
      dialogue: "42 detected in your engineering logs. Deep Thought confirms your commits are mathematically justified.",
    });
  }

  // 3. Nice (69)
  if (summary && (summary.nightCommitPercentage === 69 || repos.some((r) => r.stars === 69 || r.forks === 69))) {
    eggs.push({
      id: "egg-69",
      title: "CASE NOTE: STATISTICAL MILESTONE (69)",
      trigger: "A metric on the record equaled 69",
      unlockedAt: now,
      dialogue: "69 detected in the temporal logs. The forensic examination documents this statistical milestone.",
    });
  }

  // 4. Milestone (420)
  if (summary && (summary.totalCommits === 420 || repos.some((r) => r.stars === 420 || r.commitCount === 420))) {
    eggs.push({
      id: "egg-420",
      title: "CASE NOTE: MILESTONE 420",
      trigger: "A metric on the record equaled 420",
      unlockedAt: now,
      dialogue: "420 detected across your recorded activity metrics.",
    });
  }

  // 5. 1337 Elite Developer
  if (summary && (summary.totalCommits === 1337 || summary.linesAdded === 1337 || summary.linesDeleted === 1337)) {
    eggs.push({
      id: "egg-1337",
      title: "CASE NOTE: 1337 CLEARANCE",
      trigger: "A metric on the record equaled 1337",
      unlockedAt: now,
      dialogue: "1337 detected in the codebase logs. Elite authorization recognized in the forensic report.",
    });
  }

  // 6. 3 AM Witching Hour in local timezone
  const threeAmCommits = commits.filter((c) => {
    if (c.authorDate) {
      try {
        const { hour } = extractLocal(new Date(c.authorDate));
        return hour === 3;
      } catch {
        return c.hour === 3;
      }
    }
    return c.hour === 3;
  });
  if (threeAmCommits.length >= 3) {
    eggs.push({
      id: "egg-3am",
      title: `CASE NOTE: 03:00 ${tzAbbr} WITCHING HOUR`,
      trigger: `${threeAmCommits.length} commits timestamped between 03:00 and 03:59 ${tzAbbr}`,
      unlockedAt: now,
      dialogue: `Multiple 03:00 ${tzAbbr} commit timestamps recorded. Circadian rebellion documented in the file.`,
    });
  }

  // 7. Transcendental Ratio (314)
  if (summary && (summary.totalCommits === 314 || summary.totalActiveDays === 314)) {
    eggs.push({
      id: "egg-pi",
      title: "CASE NOTE: TRANSCENDENTAL CONSTANT (314)",
      trigger: "Exact match: 314 commits or active days recorded",
      unlockedAt: now,
      dialogue: "Pi constant (314) detected in your activity telemetry. Mathematical harmony observed.",
    });
  }

  // 8. Palindrome Commits (>= 100)
  if (summary && summary.totalCommits >= 100) {
    const s = String(summary.totalCommits);
    if (s === s.split("").reverse().join("")) {
      eggs.push({
        id: "egg-palindrome",
        title: "CASE NOTE: PALINDROMIC COMMIT RECORD",
        trigger: `Total commit volume (${summary.totalCommits}) is a palindrome`,
        unlockedAt: now,
        dialogue: `Your total commit count (${summary.totalCommits}) reads identically backwards and forwards.`,
      });
    }
  }

  // 9. Midnight Stalker (00:00 - 00:59 commits >= 3)
  const midnightCommits = commits.filter((c) => {
    if (c.authorDate) {
      try {
        const { hour } = extractLocal(new Date(c.authorDate));
        return hour === 0;
      } catch {
        return c.hour === 0;
      }
    }
    return c.hour === 0;
  });
  if (midnightCommits.length >= 3) {
    eggs.push({
      id: "egg-midnight",
      title: `CASE NOTE: 00:00 ${tzAbbr} MIDNIGHT SHIFT`,
      trigger: `${midnightCommits.length} commits logged during the zero-hour`,
      unlockedAt: now,
      dialogue: "Active engineering logged right at midnight boundary. Date boundaries ignored.",
    });
  }

  return eggs;
}
