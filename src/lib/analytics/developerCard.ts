/**
 * GITOPSY DEVELOPER CARD ENGINE
 * Generates the canonical, shareable Developer Card payload from overall GitHub activity.
 * Strictly developer-wide metrics only — ZERO repository-specific data.
 * 100% deterministic, zero LLM, local-first.
 */

import { GitopsyAnalysis } from "@/types/domain";

export interface DeveloperCardSupportingStat {
  label: string;
  value: string;
}

export interface CodeDnaItem {
  name: string;
  percentage: number;
  color: string;
}

export interface DeveloperCardData {
  username: string;
  displayName: string | null;
  avatarUrl: string;
  memberSinceYear: number | null;
  primaryClassification: string;
  classificationMetric: string;
  caseNote: string;
  supportingStats: DeveloperCardSupportingStat[];
  codeDna: CodeDnaItem[];
  accentColor: string;
  fileNo: string;
  totalCommits: number;
  activeDays: number;
  longestStreak: number;
  topLanguage: string | null;
  languageCount: number;
  busiestHour: number;
  timezoneAbbr: string;
}

/**
 * Standard GitHub language color map for Code DNA bar rendering.
 */
export const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: "#3178C6",
  JavaScript: "#F7DF1E",
  Python: "#3572A5",
  Go: "#00ADD8",
  Rust: "#DEA584",
  Java: "#B07219",
  "C++": "#F34B7D",
  C: "#555555",
  "C#": "#178600",
  Ruby: "#701516",
  PHP: "#4F5D95",
  Swift: "#F05138",
  Kotlin: "#A97BFF",
  Dart: "#00B4AB",
  HTML: "#E34C26",
  CSS: "#563D7C",
  Shell: "#89E051",
  Vue: "#41B883",
  Svelte: "#FF3E00",
  Zig: "#EC915C",
  Elixir: "#6E4A7E",
  Scala: "#DC322F",
};

export function getLanguageColor(langName: string): string {
  return LANGUAGE_COLORS[langName] || "#9CA3AF";
}

/**
 * Curated, human-written, deterministic quote library.
 * Dry, clever, forensic, and developer-aware.
 */
export const CLASSIFICATION_QUOTES: Record<string, string[]> = {
  "NIGHT OWL": [
    "Apparently daylight was optional.",
    "The keyboard kept unusual office hours.",
    "Some commits were filed well after bedtime.",
  ],
  "EARLY BIRD": [
    "Commits deployed before sunrise were considered routine.",
    "Early morning momentum on the record.",
    "Dawn was apparently the ideal deployment window.",
  ],
  "WEEKEND WARRIOR": [
    "Your weekends entered the investigation.",
    "Saturday and Sunday bore the brunt of the work.",
    "The keyboard did not take weekends off.",
  ],
  "MARATHON BUILDER": [
    "At some point this stopped being a streak.",
    "The keyboard stayed on continuous duty.",
    "Suspiciously uninterrupted daily momentum.",
  ],
  "POLYGLOT": [
    "The laboratory speaks several dialects.",
    "One dialect was apparently not enough.",
    "The codebase refused to settle on one syntax.",
  ],
  "CODE SURGEON": [
    "Small changes. Suspiciously surgical.",
    "High commit density with minimal line disruption.",
    "Trunk was rarely broken under this surgical regime.",
  ],
  "HEAVYWEIGHT": [
    "One commit. One very large decision.",
    "Massive diff deployments detected in the record.",
    "Substantial architectural shifts in single passes.",
  ],
  "CODE DEMOLITIONIST": [
    "Some code was here. It is no longer with us.",
    "Deleting code is the purest form of engineering.",
    "A remarkable volume of legacy syntax incinerated.",
  ],
  "COLLABORATOR": [
    "Apparently, other people were allowed into the code.",
    "High diplomatic activity in pull requests and reviews.",
    "Frequent peer engagement documented in the record.",
  ],
  "SOLO OPERATOR": [
    "No witnesses. Just commits.",
    "Zero pull requests. Pure autonomous velocity.",
    "Direct trunk pushes with no review overhead.",
  ],
  "CONVENTIONAL DISCIPLINE": [
    "Your commit history is suspiciously tidy.",
    "Strict structured prefixes documented across all commits.",
    "An admirable devotion to commit message hygiene.",
  ],
  "FIX ADDICT": [
    "A relentless stream of corrective commits.",
    "High dedication to solving problems on the fly.",
    "Direct confrontation with bugs documented on the record.",
  ],
  "WIP SPECIALIST": [
    "Work-in-progress checkpoints left on the record.",
    "Frequent saves while developing in flight.",
    "The commit log served as an active draft notebook.",
  ],
  "THE COMEBACK": [
    "The keyboard was silent. Then suddenly it wasn't.",
    "A dramatic resurgence detected in commit cadence.",
  ],
  "STEADY BUILDER": [
    "Disappointingly well behaved.",
    "Consistent and balanced daily development cadence.",
    "A measured and predictable engineering rhythm.",
  ],
  "EARLY EVIDENCE": [
    "More history remains to be examined.",
    "Preliminary records on a developing case file.",
  ],
};

/**
 * Deterministic string hash function.
 */
function hashString(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) + hash + str.charCodeAt(i);
  }
  return Math.abs(hash);
}

/**
 * Builds the canonical Developer Card data from a GitopsyAnalysis.
 * STRICT GUARANTEE: Uses only developer-wide summary totals.
 * Never accesses repository names, repository stars, or commit SHAs.
 */
export function buildDeveloperCardData(analysis: GitopsyAnalysis): DeveloperCardData {
  const { subject, summary, languages, commitForensics } = analysis;

  const totalCommits = summary?.totalCommits || 0;
  const activeDays = summary?.totalActiveDays || 0;
  const longestStreak = summary?.longestStreakDays || 0;
  const linesAdded = summary?.linesAdded || 0;
  const linesDeleted = summary?.linesDeleted || 0;
  const tzAbbr = summary?.timezoneAbbr || "local";
  const peakHour = summary?.busiestHour ?? 14;
  const nightPct = summary?.nightCommitPercentage || 0;
  const weekendPct = summary?.weekendCommitPercentage || 0;
  const functionalLangs = languages?.filter((l) => l.isFunctional !== false && l.percentage >= 3) || [];
  const prs = summary?.prsAuthored || 0;
  const convCount = commitForensics?.conventionalCommitCount || 0;
  const convPct = totalCommits > 0 ? Math.round((convCount / totalCommits) * 100) : 0;
  const largestCommit = commitForensics?.largestCommit;
  const largestDiff = largestCommit ? largestCommit.additions + largestCommit.deletions : 0;
  const medianSize = commitForensics?.medianCommitSize || 0;

  // Member Since Year
  const memberSinceYear = subject.createdAt ? new Date(subject.createdAt).getFullYear() : null;

  // Compute Code DNA (top 3-4 languages with normalized percentages)
  const rawLangs = (languages && languages.length > 0 ? languages : []).filter(
    (l) => l.percentage >= 3
  );
  let codeDna: CodeDnaItem[] = rawLangs.slice(0, 4).map((l) => ({
    name: l.name,
    percentage: Math.round(l.percentage),
    color: getLanguageColor(l.name),
  }));

  if (codeDna.length === 0) {
    if (languages && languages.length > 0) {
      codeDna = [
        {
          name: languages[0].name,
          percentage: 100,
          color: getLanguageColor(languages[0].name),
        },
      ];
    } else {
      codeDna = [{ name: "Code", percentage: 100, color: "#3178C6" }];
    }
  }

  // Generate deterministic 4-character hex file identifier
  const hashVal = hashString(subject.login + (subject.createdAt || ""));
  const fileNo = `CASE FILE #${(hashVal % 0xffff).toString(16).toUpperCase().padStart(4, "0")}`;

  // =========================================================================
  // 1. SELECT PRIMARY DEVELOPER-WIDE CLASSIFICATION & DYNAMIC ACCENT COLOR
  // =========================================================================
  interface ClassificationCandidate {
    title: string;
    metric: string;
    accentColor: string;
    supportingStats: DeveloperCardSupportingStat[];
    score: number;
  }

  const candidates: ClassificationCandidate[] = [];

  // Low Data Fallback (< 15 commits)
  if (totalCommits < 15) {
    const earlyStats: DeveloperCardSupportingStat[] = [
      { label: "COMMITS", value: totalCommits.toLocaleString() },
      { label: "ACTIVE DAYS", value: `${activeDays || 1}` },
      { label: "LANGUAGES", value: `${codeDna.length || 1}` },
    ];

    return {
      username: subject.login,
      displayName: subject.name || null,
      avatarUrl: subject.avatarUrl,
      memberSinceYear,
      primaryClassification: "EARLY EVIDENCE",
      classificationMetric: `${totalCommits} COMMITS ON RECORD`,
      caseNote: CLASSIFICATION_QUOTES["EARLY EVIDENCE"][0],
      supportingStats: earlyStats,
      codeDna,
      accentColor: "#FFDC58",
      fileNo,
      totalCommits,
      activeDays,
      longestStreak,
      topLanguage: codeDna[0]?.name || null,
      languageCount: codeDna.length,
      busiestHour: peakHour,
      timezoneAbbr: tzAbbr,
    };
  }

  // Candidate: Night Owl (Purple)
  if (nightPct >= 40 && totalCommits >= 20) {
    candidates.push({
      title: "NIGHT OWL",
      metric: `${nightPct}% AFTER DARK`,
      accentColor: "#C084FC",
      supportingStats: [
        { label: "COMMITS", value: totalCommits.toLocaleString() },
        { label: "ACTIVE DAYS", value: `${activeDays}` },
        { label: "PEAK HOUR", value: `${peakHour.toString().padStart(2, "0")}:00 ${tzAbbr}` },
        { label: "STREAK", value: `${longestStreak}D` },
      ],
      score: 95,
    });
  }

  // Candidate: Heavyweight / Monster Commit (Red)
  if (largestDiff >= 2000) {
    candidates.push({
      title: "HEAVYWEIGHT",
      metric: `${largestDiff.toLocaleString()} LINES IN ONE COMMIT`,
      accentColor: "#F43F5E",
      supportingStats: [
        { label: "COMMITS", value: totalCommits.toLocaleString() },
        { label: "ACTIVE DAYS", value: `${activeDays}` },
        { label: "STREAK", value: `${longestStreak}D` },
        { label: "DIALECTS", value: `${codeDna.length}` },
      ],
      score: 92,
    });
  }

  // Candidate: Code Demolitionist (Red/Coral)
  if (linesDeleted >= 1500 && linesDeleted >= linesAdded * 0.45 && totalCommits >= 20) {
    candidates.push({
      title: "CODE DEMOLITIONIST",
      metric: `-${linesDeleted.toLocaleString()} LINES INCINERATED`,
      accentColor: "#F43F5E",
      supportingStats: [
        { label: "COMMITS", value: totalCommits.toLocaleString() },
        { label: "ACTIVE DAYS", value: `${activeDays}` },
        { label: "STREAK", value: `${longestStreak}D` },
        { label: "LANGUAGES", value: `${codeDna.length}` },
      ],
      score: 90,
    });
  }

  // Candidate: Marathon Builder (Blue)
  if (longestStreak >= 21) {
    candidates.push({
      title: "MARATHON BUILDER",
      metric: `${longestStreak} DAYS UNBROKEN STREAK`,
      accentColor: "#4D96FF",
      supportingStats: [
        { label: "COMMITS", value: totalCommits.toLocaleString() },
        { label: "ACTIVE DAYS", value: `${activeDays}` },
        { label: "STREAK", value: `${longestStreak} DAYS` },
        { label: "DIALECTS", value: `${codeDna.length}` },
      ],
      score: 88,
    });
  }

  // Candidate: Polyglot (Cyan/Teal)
  if (codeDna.length >= 3 && totalCommits >= 25) {
    candidates.push({
      title: "POLYGLOT",
      metric: `${codeDna.length} PROGRAMMING DIALECTS`,
      accentColor: "#2DD4BF",
      supportingStats: [
        { label: "COMMITS", value: totalCommits.toLocaleString() },
        { label: "ACTIVE DAYS", value: `${activeDays}` },
        { label: "LANGUAGES", value: `${codeDna.length}` },
        { label: "PRIMARY", value: codeDna[0]?.name || "Code" },
      ],
      score: 86,
    });
  }

  // Candidate: Weekend Warrior (Blue/Orange)
  if (weekendPct >= 35 && totalCommits >= 20) {
    candidates.push({
      title: "WEEKEND WARRIOR",
      metric: `${weekendPct}% WEEKEND COMMITS`,
      accentColor: "#FD9745",
      supportingStats: [
        { label: "COMMITS", value: totalCommits.toLocaleString() },
        { label: "ACTIVE DAYS", value: `${activeDays}` },
        { label: "STREAK", value: `${longestStreak}D` },
        { label: "WEEKEND", value: `${weekendPct}%` },
      ],
      score: 84,
    });
  }

  // Candidate: Code Surgeon (Green)
  if (medianSize <= 18 && totalCommits >= 30) {
    candidates.push({
      title: "CODE SURGEON",
      metric: `MEDIAN ${medianSize} LINES / COMMIT`,
      accentColor: "#6BCB77",
      supportingStats: [
        { label: "COMMITS", value: totalCommits.toLocaleString() },
        { label: "ACTIVE DAYS", value: `${activeDays}` },
        { label: "MEDIAN SIZE", value: `${medianSize}L` },
        { label: "STREAK", value: `${longestStreak}D` },
      ],
      score: 80,
    });
  }

  // Candidate: Solo Operator (Purple/Indigo)
  if (prs === 0 && totalCommits >= 25) {
    candidates.push({
      title: "SOLO OPERATOR",
      metric: "100% DIRECT TRUNK PUSHES",
      accentColor: "#A855F7",
      supportingStats: [
        { label: "COMMITS", value: totalCommits.toLocaleString() },
        { label: "ACTIVE DAYS", value: `${activeDays}` },
        { label: "STREAK", value: `${longestStreak}D` },
        { label: "DIALECTS", value: `${codeDna.length}` },
      ],
      score: 75,
    });
  }

  // Candidate: Conventional Discipline (Teal)
  if (convPct >= 70 && totalCommits >= 25) {
    candidates.push({
      title: "CONVENTIONAL DISCIPLINE",
      metric: `${convPct}% STRUCTURED COMMITS`,
      accentColor: "#2DD4BF",
      supportingStats: [
        { label: "COMMITS", value: totalCommits.toLocaleString() },
        { label: "ACTIVE DAYS", value: `${activeDays}` },
        { label: "STRUCTURED", value: `${convPct}%` },
        { label: "STREAK", value: `${longestStreak}D` },
      ],
      score: 72,
    });
  }

  // Fallback: Steady Builder (Yellow)
  candidates.push({
    title: "STEADY BUILDER",
    metric: `${totalCommits.toLocaleString()} COMMITS ON RECORD`,
    accentColor: "#FFDC58",
    supportingStats: [
      { label: "COMMITS", value: totalCommits.toLocaleString() },
      { label: "ACTIVE DAYS", value: `${activeDays}` },
      { label: "STREAK", value: `${longestStreak}D` },
      { label: "DIALECTS", value: `${codeDna.length}` },
    ],
    score: 10,
  });

  // Pick top scoring candidate
  candidates.sort((a, b) => b.score - a.score);
  const chosen = candidates[0];

  // =========================================================================
  // 2. DETERMINISTIC QUOTE SELECTION
  // =========================================================================
  const quotePool = CLASSIFICATION_QUOTES[chosen.title] || CLASSIFICATION_QUOTES["STEADY BUILDER"];
  const quoteIndex = hashString(subject.login + chosen.title) % quotePool.length;
  const caseNote = quotePool[quoteIndex];

  // Strictly enforce maximum 4 supporting stats
  const finalSupportingStats = chosen.supportingStats.slice(0, 4);

  return {
    username: subject.login,
    displayName: subject.name || null,
    avatarUrl: subject.avatarUrl,
    memberSinceYear,
    primaryClassification: chosen.title,
    classificationMetric: chosen.metric,
    caseNote,
    supportingStats: finalSupportingStats,
    codeDna,
    accentColor: chosen.accentColor,
    fileNo,
    totalCommits,
    activeDays,
    longestStreak,
    topLanguage: codeDna[0]?.name || null,
    languageCount: codeDna.length,
    busiestHour: peakHour,
    timezoneAbbr: tzAbbr,
  };
}
