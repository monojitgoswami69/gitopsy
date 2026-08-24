/**
 * REPOSITORY AWARDS ENGINE
 * Deterministically grants awards based on measured repository criteria.
 */

import { RepositoryAnalysis, RepositoryAward } from "@/types/domain";

export function generateRepositoryAwards(
  repos: RepositoryAnalysis[],
  totalUserCommits: number
): RepositoryAward[] {
  const awards: RepositoryAward[] = [];
  if (repos.length === 0) return awards;

  const totalCommits = Math.max(1, totalUserCommits);

  // 1. THE WORKHORSE
  // Repository with highest overall commit count
  const sortedByCommits = [...repos].sort((a, b) => b.commitCount - a.commitCount);
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
  // Repository commanding > 40% of the user's total code activity
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

  // 3. THE GHOST TOWN
  // Previously active (> 5 commits) but inactive for > 180 days
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
      description: "Substantial historical code base now peacefully resting in deep dormancy.",
      evidence: `Untouched for ${ghostTown.daysSinceLastPush} days after logging ${ghostTown.commitCount} commits.`,
    });
  }

  // 4. THE COMEBACK KID
  // Has activity span > 180 days with recent push in last 30 days and commit count >= 8
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
      evidence: `Spanned ${comebackKid.activitySpanDays} days; active ${comebackKid.daysSinceLastPush}d ago.`,
    });
  }

  // 5. THE SIDE PROJECT
  // Low commit count (3 - 15 commits) but distinct from the primary project
  const sideProject = repos.find(
    (r) => r.commitCount >= 3 && r.commitCount <= 15 && r.fullName !== workhorse?.fullName
  );
  if (sideProject) {
    awards.push({
      id: "award-side-project",
      title: "THE SIDE PROJECT",
      category: "CRAFT",
      repoFullName: sideProject.fullName,
      badge: "🧪",
      description: "A focused, modest initiative developed alongside primary repositories.",
      evidence: `${sideProject.commitCount} commits logged in a compact, standalone scope.`,
    });
  }

  // 6. THE CHAOS ENGINE
  // Highest churn relative to commit count
  const sortedByChurnRatio = [...repos]
    .filter((r) => r.commitCount >= 3)
    .sort((a, b) => (b.additions + b.deletions) / b.commitCount - (a.additions + a.deletions) / a.commitCount);
  const chaosEngine = sortedByChurnRatio[0];
  if (chaosEngine && (chaosEngine.additions + chaosEngine.deletions) / chaosEngine.commitCount > 200) {
    const avgChurn = Math.round((chaosEngine.additions + chaosEngine.deletions) / chaosEngine.commitCount);
    awards.push({
      id: "award-chaos-engine",
      title: "THE CHAOS ENGINE",
      category: "CHAOS",
      repoFullName: chaosEngine.fullName,
      badge: "🌪️",
      description: "Highest blast radius per commit. Characterized by large batch modifications.",
      evidence: `Averaged ${avgChurn.toLocaleString()} lines churned per individual commit.`,
    });
  }

  // 7. THE MONOLITH
  // Single repository containing > 60% of all code volume
  const monolith = repos.find((r) => r.commitCount / totalCommits >= 0.6 && r.commitCount >= 20);
  if (monolith) {
    awards.push({
      id: "award-monolith",
      title: "THE MONOLITH",
      category: "SCALE",
      repoFullName: monolith.fullName,
      badge: "🗿",
      description: "An overwhelmingly dense center of gravity anchoring your GitHub identity.",
      evidence: `${Math.round((monolith.commitCount / totalCommits) * 100)}% of your entire GitHub output lives in this single repository.`,
    });
  }

  return awards;
}
