/**
 * REPOSITORY DISTINCTIONS ENGINE
 * Deterministically grants distinctions based on measured repository criteria.
 */

import { RepositoryAnalysis, RepositoryAward } from "@/types/domain";

interface CandidateAward extends RepositoryAward {
  marginScore: number;
}

export function generateRepositoryAwards(
  repos: RepositoryAnalysis[],
  totalUserCommits: number
): RepositoryAward[] {
  if (repos.length === 0) return [];

  const candidates: CandidateAward[] = [];
  const totalCommits = Math.max(1, totalUserCommits);
  const activeRepos = repos.filter((r) => !r.isArchived);

  // 1. THE WORKHORSE
  // Repository with highest overall commit count (min 10 commits)
  const sortedByCommits = [...repos].sort((a, b) => b.commitCount - a.commitCount || a.daysSinceLastPush - b.daysSinceLastPush);
  const workhorse = sortedByCommits[0];
  if (workhorse && workhorse.commitCount >= 10) {
    const commitMargin = (workhorse.commitCount - 10) / 10;
    const portfolioShare = (workhorse.commitCount / totalCommits) * 2;
    candidates.push({
      id: "award-workhorse",
      title: "THE WORKHORSE",
      category: "VELOCITY",
      repoFullName: workhorse.fullName,
      badge: "⚡",
      description: "Carried the largest sustained volume of commits and active engineering output.",
      evidence: `${workhorse.commitCount.toLocaleString()} total commits recorded (${Math.round((workhorse.commitCount / totalCommits) * 100)}% of total output).`,
      marginScore: commitMargin + portfolioShare,
    });
  }

  // 2. THE MAIN CHARACTER
  // Repository commanding >= 40% of the user's total code activity (min 15 commits)
  const mainCharacter = repos.find((r) => r.commitCount / totalCommits >= 0.4 && r.commitCount >= 15);
  if (mainCharacter) {
    const shareMargin = ((mainCharacter.commitCount / totalCommits - 0.4) / 0.4) * 2.5;
    const countMargin = (mainCharacter.commitCount - 15) / 15;
    candidates.push({
      id: "award-main-character",
      title: "THE MAIN CHARACTER",
      category: "SCALE",
      repoFullName: mainCharacter.fullName,
      badge: "👑",
      description: "Commands the dominant share of your developer portfolio.",
      evidence: `${Math.round((mainCharacter.commitCount / totalCommits) * 100)}% of all user commits concentrated here.`,
      marginScore: shareMargin + countMargin,
    });
  }

  // 3. THE MONOLITH
  // Single repository containing >= 65% of all code volume (min 20 commits)
  const monolith = repos.find((r) => r.commitCount / totalCommits >= 0.65 && r.commitCount >= 20);
  if (monolith) {
    const shareMargin = ((monolith.commitCount / totalCommits - 0.65) / 0.65) * 3.5;
    const countMargin = (monolith.commitCount - 20) / 20;
    candidates.push({
      id: "award-monolith",
      title: "THE MONOLITH",
      category: "SCALE",
      repoFullName: monolith.fullName,
      badge: "🗿",
      description: "Overwhelming concentration of code volume and commit gravity.",
      evidence: `${Math.round((monolith.commitCount / totalCommits) * 100)}% of your entire GitHub output lives in this single repository.`,
      marginScore: shareMargin + countMargin,
    });
  }

  // 4. THE GHOST TOWN
  // Previously active (>= 5 commits) but inactive for >= 180 days
  const ghostTown = [...repos]
    .filter((r) => r.commitCount >= 5 && r.daysSinceLastPush >= 180)
    .sort((a, b) => b.daysSinceLastPush - a.daysSinceLastPush)[0];
  if (ghostTown) {
    const dormancyMargin = (ghostTown.daysSinceLastPush - 180) / 180;
    const commitWeight = Math.min(1.5, (ghostTown.commitCount - 5) / 10);
    candidates.push({
      id: "award-ghost-town",
      title: "THE GHOST TOWN",
      category: "SURVIVAL",
      repoFullName: ghostTown.fullName,
      badge: "🏚️",
      description: "Historical codebase now in long-term dormancy.",
      evidence: `Untouched for ${ghostTown.daysSinceLastPush} days after logging ${ghostTown.commitCount} commits.`,
      marginScore: dormancyMargin + commitWeight,
    });
  }

  // 5. THE COMEBACK KID
  // Has activity span >= 180 days with recent push in last 30 days and commit count >= 8
  const comebackKid = repos.find(
    (r) => r.activitySpanDays >= 180 && r.daysSinceLastPush <= 30 && r.commitCount >= 8
  );
  if (comebackKid) {
    const spanMargin = (comebackKid.activitySpanDays - 180) / 180;
    const recencyMargin = (30 - comebackKid.daysSinceLastPush) / 30;
    const countMargin = (comebackKid.commitCount - 8) / 8;
    candidates.push({
      id: "award-comeback-kid",
      title: "THE COMEBACK KID",
      category: "SURVIVAL",
      repoFullName: comebackKid.fullName,
      badge: "🧟",
      description: "Long-standing codebase revived with recent active contributions.",
      evidence: `Active span of ${comebackKid.activitySpanDays} days; updated within the last ${comebackKid.daysSinceLastPush} days.`,
      marginScore: spanMargin + recencyMargin + countMargin,
    });
  }

  // 6. THE SIDE QUEST
  // Meaningful secondary project (4 - 15 commits, updated in last 180 days, distinct from workhorse)
  const sideQuest = repos.find(
    (r) => r.commitCount >= 4 && r.commitCount <= 15 && r.fullName !== workhorse?.fullName && r.daysSinceLastPush <= 180
  );
  if (sideQuest) {
    const compactBalance = 1 - Math.abs(sideQuest.commitCount - 8) / 8;
    const recencyScore = (180 - sideQuest.daysSinceLastPush) / 180;
    candidates.push({
      id: "award-side-quest",
      title: "THE SIDE QUEST",
      category: "CRAFT",
      repoFullName: sideQuest.fullName,
      badge: "🧪",
      description: "A focused, modest initiative developed alongside primary repositories.",
      evidence: `${sideQuest.commitCount} commits logged in a compact, active scope.`,
      marginScore: compactBalance + recencyScore,
    });
  }

  // 7. THE CHAOS ENGINE
  // Highest churn relative to commit count (> 250 lines/commit, min 3 commits)
  const sortedByChurnRatio = [...repos]
    .filter((r) => r.commitCount >= 3)
    .sort((a, b) => (b.additions + b.deletions) / b.commitCount - (a.additions + a.deletions) / a.commitCount);
  const chaosEngine = sortedByChurnRatio[0];
  if (chaosEngine && (chaosEngine.additions + chaosEngine.deletions) / chaosEngine.commitCount > 250) {
    const avgChurn = Math.round((chaosEngine.additions + chaosEngine.deletions) / chaosEngine.commitCount);
    const churnMargin = (avgChurn - 250) / 250;
    candidates.push({
      id: "award-chaos-engine",
      title: "THE CHAOS ENGINE",
      category: "CHAOS",
      repoFullName: chaosEngine.fullName,
      badge: "🌪️",
      description: "Highest line modification blast radius per commit.",
      evidence: `Averaged ${avgChurn.toLocaleString()} lines churned per individual commit.`,
      marginScore: churnMargin,
    });
  }

  // 8. THE SLEEPER HIT
  // High community reception with compact commit volume (<= 25 commits and >= 15 stars)
  const sleeperHit = repos.find((r) => r.commitCount <= 25 && r.stars >= 15);
  if (sleeperHit) {
    const starMargin = (sleeperHit.stars - 15) / 15;
    const efficiency = (25 - sleeperHit.commitCount) / 25;
    candidates.push({
      id: "award-sleeper-hit",
      title: "THE SLEEPER HIT",
      category: "SCALE",
      repoFullName: sleeperHit.fullName,
      badge: "🌟",
      description: "Exceptional community reception relative to repository commit volume.",
      evidence: `${sleeperHit.stars} stars accumulated across ${sleeperHit.commitCount} recorded commits.`,
      marginScore: starMargin + efficiency,
    });
  }

  // 9. THE SWISS ARMY KNIFE
  // Multi-language repository with >= 3 languages each holding >= 10% byte share
  const multiLangRepo = repos.find((r) => {
    const significantLangs = r.languages.filter((l) => l.percentage >= 10);
    return significantLangs.length >= 3;
  });
  if (multiLangRepo) {
    const significantLangs = multiLangRepo.languages.filter((l) => l.percentage >= 10);
    const langCountMargin = (significantLangs.length - 3) * 1.5;
    const breadthMargin = significantLangs.reduce((acc, l) => acc + (l.percentage - 10), 0) / 100;
    candidates.push({
      id: "award-swiss-knife",
      title: "THE SWISS ARMY KNIFE",
      category: "CRAFT",
      repoFullName: multiLangRepo.fullName,
      badge: "🛠️",
      description: "Multi-disciplinary codebase utilizing multiple active programming languages.",
      evidence: `${significantLangs.length} distinct languages each hold ≥ 10% of codebase bytes.`,
      marginScore: langCountMargin + breadthMargin + 0.5,
    });
  }

  // 10. THE ETERNAL FLAME
  // Oldest active non-fork repository updated in the last 30 days
  const nonForkActive = activeRepos
    .filter((r) => !r.isFork && r.daysSinceLastPush <= 30 && r.commitCount >= 5)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  const eternalFlame = nonForkActive[0];
  if (eternalFlame && eternalFlame.activitySpanDays >= 365) {
    const spanMargin = (eternalFlame.activitySpanDays - 365) / 365;
    const recencyMargin = (30 - eternalFlame.daysSinceLastPush) / 30;
    candidates.push({
      id: "award-eternal-flame",
      title: "THE ETERNAL FLAME",
      category: "SURVIVAL",
      repoFullName: eternalFlame.fullName,
      badge: "🕯️",
      description: "Longest-lived non-fork repository with active maintenance in the last 30 days.",
      evidence: `Active lifespan of ${eternalFlame.activitySpanDays} days; maintained continuously since ${eternalFlame.createdAt.slice(0, 10)}.`,
      marginScore: spanMargin + recencyMargin,
    });
  }

  // Rank by highest margin of qualification and strictly cap at topmost 6
  return candidates
    .sort((a, b) => b.marginScore - a.marginScore)
    .slice(0, 6)
    .map(({ marginScore: _, ...award }) => award);
}
