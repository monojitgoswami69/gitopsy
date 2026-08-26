/**
 * REPOSITORY DISTINCTIONS ENGINE
 * Deterministically grants distinctions based on measured repository criteria.
 */

import { RepositoryAnalysis, RepositoryAward } from "@/types/domain";

export function generateRepositoryAwards(
  repos: RepositoryAnalysis[],
  totalUserCommits: number
): RepositoryAward[] {
  const awards: RepositoryAward[] = [];
  if (repos.length === 0) return awards;

  const totalCommits = Math.max(1, totalUserCommits);
  const activeRepos = repos.filter((r) => !r.isArchived);

  // 1. THE WORKHORSE
  // Repository with highest overall commit count (min 10 commits)
  const sortedByCommits = [...repos].sort((a, b) => b.commitCount - a.commitCount || a.daysSinceLastPush - b.daysSinceLastPush);
  const workhorse = sortedByCommits[0];
  if (workhorse && workhorse.commitCount >= 10) {
    awards.push({
      id: "award-workhorse",
      title: "THE WORKHORSE",
      category: "VELOCITY",
      repoFullName: workhorse.fullName,
      badge: "⚡",
      description: "Carried the largest sustained volume of commits and active engineering output.",
      evidence: `${workhorse.commitCount.toLocaleString()} total commits recorded (${Math.round((workhorse.commitCount / totalCommits) * 100)}% of total output).`,
    });
  }

  // 2. THE MAIN CHARACTER
  // Repository commanding >= 40% of the user's total code activity (min 15 commits)
  const mainCharacter = repos.find((r) => r.commitCount / totalCommits >= 0.4 && r.commitCount >= 15);
  if (mainCharacter) {
    awards.push({
      id: "award-main-character",
      title: "THE MAIN CHARACTER",
      category: "SCALE",
      repoFullName: mainCharacter.fullName,
      badge: "👑",
      description: "Commands the dominant share of your developer portfolio.",
      evidence: `${Math.round((mainCharacter.commitCount / totalCommits) * 100)}% of all user commits concentrated here.`,
    });
  }

  // 3. THE MONOLITH
  // Single repository containing >= 65% of all code volume (min 20 commits)
  const monolith = repos.find((r) => r.commitCount / totalCommits >= 0.65 && r.commitCount >= 20);
  if (monolith) {
    awards.push({
      id: "award-monolith",
      title: "THE MONOLITH",
      category: "SCALE",
      repoFullName: monolith.fullName,
      badge: "🗿",
      description: "Overwhelming concentration of code volume and commit gravity.",
      evidence: `${Math.round((monolith.commitCount / totalCommits) * 100)}% of your entire GitHub output lives in this single repository.`,
    });
  }

  // 4. THE GHOST TOWN
  // Previously active (>= 5 commits) but inactive for >= 180 days
  const ghostTown = [...repos]
    .filter((r) => r.commitCount >= 5 && r.daysSinceLastPush >= 180)
    .sort((a, b) => b.daysSinceLastPush - a.daysSinceLastPush)[0];
  if (ghostTown) {
    awards.push({
      id: "award-ghost-town",
      title: "THE GHOST TOWN",
      category: "SURVIVAL",
      repoFullName: ghostTown.fullName,
      badge: "🏚️",
      description: "Historical codebase now in long-term dormancy.",
      evidence: `Untouched for ${ghostTown.daysSinceLastPush} days after logging ${ghostTown.commitCount} commits.`,
    });
  }

  // 5. THE COMEBACK KID
  // Has activity span >= 180 days with recent push in last 30 days and commit count >= 8
  const comebackKid = repos.find(
    (r) => r.activitySpanDays >= 180 && r.daysSinceLastPush <= 30 && r.commitCount >= 8
  );
  if (comebackKid) {
    awards.push({
      id: "award-comeback-kid",
      title: "THE COMEBACK KID",
      category: "SURVIVAL",
      repoFullName: comebackKid.fullName,
      badge: "🧟",
      description: "Long-standing codebase revived with recent active contributions.",
      evidence: `Active span of ${comebackKid.activitySpanDays} days; updated within the last ${comebackKid.daysSinceLastPush} days.`,
    });
  }

  // 6. THE SIDE QUEST
  // Meaningful secondary project (4 - 15 commits, updated in last 180 days, distinct from workhorse)
  const sideQuest = repos.find(
    (r) => r.commitCount >= 4 && r.commitCount <= 15 && r.fullName !== workhorse?.fullName && r.daysSinceLastPush <= 180
  );
  if (sideQuest) {
    awards.push({
      id: "award-side-quest",
      title: "THE SIDE QUEST",
      category: "CRAFT",
      repoFullName: sideQuest.fullName,
      badge: "🧪",
      description: "A focused, modest initiative developed alongside primary repositories.",
      evidence: `${sideQuest.commitCount} commits logged in a compact, active scope.`,
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
    awards.push({
      id: "award-chaos-engine",
      title: "THE CHAOS ENGINE",
      category: "CHAOS",
      repoFullName: chaosEngine.fullName,
      badge: "🌪️",
      description: "Highest line modification blast radius per commit.",
      evidence: `Averaged ${avgChurn.toLocaleString()} lines churned per individual commit.`,
    });
  }

  // 8. THE SLEEPER HIT
  // High community reception with compact commit volume (<= 25 commits and >= 15 stars)
  const sleeperHit = repos.find((r) => r.commitCount <= 25 && r.stars >= 15);
  if (sleeperHit) {
    awards.push({
      id: "award-sleeper-hit",
      title: "THE SLEEPER HIT",
      category: "SCALE",
      repoFullName: sleeperHit.fullName,
      badge: "🌟",
      description: "Exceptional community reception relative to repository commit volume.",
      evidence: `${sleeperHit.stars} stars accumulated across ${sleeperHit.commitCount} recorded commits.`,
    });
  }

  // 9. THE SWISS ARMY KNIFE
  // Multi-language repository with >= 3 languages each holding >= 10% byte share
  const multiLangRepo = repos.find((r) => {
    const significantLangs = r.languages.filter((l) => l.percentage >= 10);
    return significantLangs.length >= 3;
  });
  if (multiLangRepo) {
    awards.push({
      id: "award-swiss-knife",
      title: "THE SWISS ARMY KNIFE",
      category: "CRAFT",
      repoFullName: multiLangRepo.fullName,
      badge: "🛠️",
      description: "Multi-disciplinary codebase utilizing multiple active programming languages.",
      evidence: `${multiLangRepo.languages.filter((l) => l.percentage >= 10).length} distinct languages each hold ≥ 10% of codebase bytes.`,
    });
  }

  // 10. THE ETERNAL FLAME
  // Oldest active non-fork repository updated in the last 30 days
  const nonForkActive = activeRepos
    .filter((r) => !r.isFork && r.daysSinceLastPush <= 30 && r.commitCount >= 5)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  const eternalFlame = nonForkActive[0];
  if (eternalFlame && eternalFlame.activitySpanDays >= 365) {
    awards.push({
      id: "award-eternal-flame",
      title: "THE ETERNAL FLAME",
      category: "SURVIVAL",
      repoFullName: eternalFlame.fullName,
      badge: "🕯️",
      description: "Longest-lived non-fork repository with active maintenance in the last 30 days.",
      evidence: `Active lifespan of ${eternalFlame.activitySpanDays} days; maintained continuously since ${eternalFlame.createdAt.slice(0, 10)}.`,
    });
  }

  return awards;
}
