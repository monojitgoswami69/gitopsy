/**
 * REPOSITORY DISTINCTIONS ENGINE
 * Deterministically grants distinctions to individual repositories using normalized margin-based scoring.
 */

import { RepositoryAnalysis, RepositoryAward } from "@/types/domain";

export interface CandidateAward extends RepositoryAward {
  marginScore: number;
}

export function generateRepositoryAwards(
  repos: RepositoryAnalysis[],
  totalUserCommits: number
): RepositoryAward[] {
  if (!repos || repos.length === 0) return [];

  const candidates: CandidateAward[] = [];
  const totalCommits = Math.max(1, totalUserCommits);
  const activeRepos = repos.filter((r) => !r.isArchived);

  // 1. THE WORKHORSE
  // Repository with highest overall commit count (min 15 commits, >= 15% portfolio share)
  const sortedByCommits = [...repos].sort((a, b) => b.commitCount - a.commitCount || a.daysSinceLastPush - b.daysSinceLastPush);
  const workhorse = sortedByCommits[0];
  if (workhorse && workhorse.commitCount >= 15 && (workhorse.commitCount / totalCommits) >= 0.15) {
    const countMargin = Math.min(30, ((workhorse.commitCount - 15) / 15) * 10);
    const share = (workhorse.commitCount / totalCommits) * 100;
    const shareMargin = Math.min(20, ((share - 15) / 15) * 5);
    const marginScore = 50 + countMargin + shareMargin;

    candidates.push({
      id: "award-workhorse",
      title: "THE WORKHORSE",
      category: "VELOCITY",
      repoFullName: workhorse.fullName,
      badge: "⚡",
      description: "Carried the largest sustained volume of commits and active engineering output.",
      evidence: `${workhorse.commitCount.toLocaleString()} total commits recorded (${Math.round(share)}% of portfolio volume).`,
      marginScore,
    });
  }

  // 2. THE MONOLITH (Extreme concentration >= 65% in portfolio of >= 2 repos)
  const monolith = repos.find((r) => repos.length >= 2 && (r.commitCount / totalCommits) >= 0.65 && r.commitCount >= 20);
  if (monolith) {
    const share = (monolith.commitCount / totalCommits) * 100;
    const concentrationMargin = Math.min(35, ((share - 65) / 35) * 35);
    const volumeMargin = Math.min(15, ((monolith.commitCount - 20) / 20) * 10);
    const marginScore = 55 + concentrationMargin + volumeMargin;

    candidates.push({
      id: "award-monolith",
      title: "THE MONOLITH",
      category: "SCALE",
      repoFullName: monolith.fullName,
      badge: "🗿",
      description: "Overwhelming concentration of code volume and commit gravity.",
      evidence: `${Math.round(share)}% of your entire GitHub output lives in this single repository.`,
      marginScore,
    });
  }

  // 3. THE MAIN CHARACTER (Dominant share >= 40% when Monolith is not triggered for this repo)
  const mainCharacter = repos.find(
    (r) =>
      (!monolith || monolith.fullName !== r.fullName) &&
      (r.commitCount / totalCommits) >= 0.40 &&
      r.commitCount >= 15
  );
  if (mainCharacter) {
    const share = (mainCharacter.commitCount / totalCommits) * 100;
    const shareMargin = Math.min(35, ((share - 40) / 40) * 30);
    const countMargin = Math.min(15, ((mainCharacter.commitCount - 15) / 15) * 10);
    const marginScore = 50 + shareMargin + countMargin;

    candidates.push({
      id: "award-main-character",
      title: "THE MAIN CHARACTER",
      category: "SCALE",
      repoFullName: mainCharacter.fullName,
      badge: "👑",
      description: "Commands the dominant share of your developer portfolio.",
      evidence: `${Math.round(share)}% of all user commits concentrated here.`,
      marginScore,
    });
  }

  // 4. THE GHOST TOWN (Inactive >= 180 days with >= 5 historical commits)
  // Distance beyond threshold strongly scales score: 400 days substantially outranks 181 days!
  const ghostTowns = [...repos]
    .filter((r) => r.commitCount >= 5 && r.daysSinceLastPush >= 180)
    .sort((a, b) => b.daysSinceLastPush - a.daysSinceLastPush);

  if (ghostTowns.length > 0) {
    const ghostTown = ghostTowns[0];
    const daysExcess = ghostTown.daysSinceLastPush - 180;
    // 181 days -> excess 1 -> margin ~0.1
    // 400 days -> excess 220 -> margin ~33
    // 800 days -> excess 620 -> margin ~45
    const dormancyMargin = Math.min(40, (daysExcess / 180) * 25);
    const commitWeight = Math.min(10, ((ghostTown.commitCount - 5) / 10) * 5);
    const marginScore = 50 + dormancyMargin + commitWeight;

    candidates.push({
      id: "award-ghost-town",
      title: "THE GHOST TOWN",
      category: "SURVIVAL",
      repoFullName: ghostTown.fullName,
      badge: "🏚️",
      description: "Historical codebase now in long-term dormancy.",
      evidence: `Untouched for ${ghostTown.daysSinceLastPush} days after logging ${ghostTown.commitCount} commits.`,
      marginScore,
    });
  }

  // 5. THE COMEBACK KID (Lifespan >= 180 days revived with push in last 30 days)
  const comebackCandidates = repos
    .filter((r) => r.activitySpanDays >= 180 && r.daysSinceLastPush <= 30 && r.commitCount >= 8)
    .sort((a, b) => b.activitySpanDays - a.activitySpanDays);

  if (comebackCandidates.length > 0) {
    const comebackKid = comebackCandidates[0];
    const spanMargin = Math.min(25, ((comebackKid.activitySpanDays - 180) / 180) * 15);
    const recencyMargin = Math.min(15, ((30 - comebackKid.daysSinceLastPush) / 30) * 15);
    const countMargin = Math.min(10, ((comebackKid.commitCount - 8) / 8) * 5);
    const marginScore = 50 + spanMargin + recencyMargin + countMargin;

    candidates.push({
      id: "award-comeback-kid",
      title: "THE COMEBACK KID",
      category: "SURVIVAL",
      repoFullName: comebackKid.fullName,
      badge: "🧟",
      description: "Long-standing codebase revived with recent active contributions.",
      evidence: `Active span of ${comebackKid.activitySpanDays} days; updated within the last ${comebackKid.daysSinceLastPush} days.`,
      marginScore,
    });
  }

  // 6. THE SIDE QUEST (Distinct secondary project with 5 - 20 commits, updated in last 120 days)
  const sideQuestCandidates = repos
    .filter(
      (r) =>
        r.commitCount >= 5 &&
        r.commitCount <= 20 &&
        r.fullName !== workhorse?.fullName &&
        r.daysSinceLastPush <= 120
    )
    .sort((a, b) => a.daysSinceLastPush - b.daysSinceLastPush);

  if (sideQuestCandidates.length > 0) {
    const sideQuest = sideQuestCandidates[0];
    const recencyScore = Math.min(25, ((120 - sideQuest.daysSinceLastPush) / 120) * 25);
    const compactBalance = Math.min(20, (1 - Math.abs(sideQuest.commitCount - 10) / 10) * 20);
    const marginScore = 50 + recencyScore + compactBalance;

    candidates.push({
      id: "award-side-quest",
      title: "THE SIDE QUEST",
      category: "CRAFT",
      repoFullName: sideQuest.fullName,
      badge: "🧪",
      description: "A focused, modest initiative developed alongside primary repositories.",
      evidence: `${sideQuest.commitCount} commits logged in a compact, active scope.`,
      marginScore,
    });
  }

  // 7. THE CHAOS ENGINE (Highest churn per commit > 250 lines/commit, min 3 commits)
  const sortedByChurnRatio = [...repos]
    .filter((r) => r.commitCount >= 3)
    .sort((a, b) => (b.additions + b.deletions) / b.commitCount - (a.additions + a.deletions) / a.commitCount);

  const chaosEngine = sortedByChurnRatio[0];
  if (chaosEngine && (chaosEngine.additions + chaosEngine.deletions) / chaosEngine.commitCount > 250) {
    const avgChurn = Math.round((chaosEngine.additions + chaosEngine.deletions) / chaosEngine.commitCount);
    const churnExcess = avgChurn - 250;
    const churnMargin = Math.min(45, (churnExcess / 250) * 25);
    const marginScore = 50 + churnMargin;

    candidates.push({
      id: "award-chaos-engine",
      title: "THE CHAOS ENGINE",
      category: "CHAOS",
      repoFullName: chaosEngine.fullName,
      badge: "🌪️",
      description: "Highest line modification blast radius per commit.",
      evidence: `Averaged ${avgChurn.toLocaleString()} lines churned per individual commit.`,
      marginScore,
    });
  }

  // 8. THE SLEEPER HIT (Community stars >= 15 with <= 30 commits)
  const sleeperCandidates = repos
    .filter((r) => r.commitCount <= 30 && r.stars >= 15)
    .sort((a, b) => b.stars - a.stars);

  if (sleeperCandidates.length > 0) {
    const sleeperHit = sleeperCandidates[0];
    const starMargin = Math.min(30, ((sleeperHit.stars - 15) / 15) * 20);
    const efficiencyMargin = Math.min(15, ((30 - sleeperHit.commitCount) / 30) * 15);
    const marginScore = 50 + starMargin + efficiencyMargin;

    candidates.push({
      id: "award-sleeper-hit",
      title: "THE SLEEPER HIT",
      category: "SCALE",
      repoFullName: sleeperHit.fullName,
      badge: "🌟",
      description: "Exceptional community reception relative to repository commit volume.",
      evidence: `${sleeperHit.stars} stars accumulated across ${sleeperHit.commitCount} recorded commits.`,
      marginScore,
    });
  }

  // 9. THE SWISS ARMY KNIFE (>= 3 languages each holding >= 10% byte share)
  const multiLangCandidates = repos
    .map((r) => {
      const significantLangs = (r.languages || []).filter((l) => l.percentage >= 10);
      return { repo: r, langCount: significantLangs.length, langs: significantLangs };
    })
    .filter((entry) => entry.langCount >= 3)
    .sort((a, b) => b.langCount - a.langCount);

  if (multiLangCandidates.length > 0) {
    const entry = multiLangCandidates[0];
    const langExcess = entry.langCount - 3;
    const langMargin = Math.min(30, langExcess * 15 + 10);
    const balanceScore = Math.min(15, entry.langs.reduce((acc, l) => acc + (l.percentage - 10), 0) / 5);
    const marginScore = 50 + langMargin + balanceScore;

    candidates.push({
      id: "award-swiss-knife",
      title: "THE SWISS ARMY KNIFE",
      category: "CRAFT",
      repoFullName: entry.repo.fullName,
      badge: "🛠️",
      description: "Multi-disciplinary codebase utilizing multiple active programming languages.",
      evidence: `${entry.langCount} distinct languages each hold ≥ 10% of codebase bytes.`,
      marginScore,
    });
  }

  // 10. THE ETERNAL FLAME (Oldest active non-fork repository updated in last 30 days)
  const nonForkActive = activeRepos
    .filter((r) => !r.isFork && r.daysSinceLastPush <= 30 && r.commitCount >= 8 && r.activitySpanDays >= 365)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  if (nonForkActive.length > 0) {
    const eternalFlame = nonForkActive[0];
    const spanExcess = eternalFlame.activitySpanDays - 365;
    const spanMargin = Math.min(30, (spanExcess / 365) * 20);
    const recencyMargin = Math.min(15, ((30 - eternalFlame.daysSinceLastPush) / 30) * 15);
    const marginScore = 50 + spanMargin + recencyMargin;

    candidates.push({
      id: "award-eternal-flame",
      title: "THE ETERNAL FLAME",
      category: "SURVIVAL",
      repoFullName: eternalFlame.fullName,
      badge: "🕯️",
      description: "Longest-lived non-fork repository with active maintenance in the last 30 days.",
      evidence: `Active lifespan of ${eternalFlame.activitySpanDays} days; maintained continuously since ${eternalFlame.createdAt.slice(0, 10)}.`,
      marginScore,
    });
  }

  // Rank by highest marginScore descending (independent of code order) and strictly cap at strongest 6
  return candidates
    .sort((a, b) => b.marginScore - a.marginScore)
    .slice(0, 6)
    .map(({ marginScore: _, ...award }) => award);
}
