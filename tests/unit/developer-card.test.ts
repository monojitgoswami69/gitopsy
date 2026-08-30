import { describe, it, expect } from "vitest";
import { buildDeveloperCardData } from "@/lib/analytics/developerCard";
import { drawDeveloperCard } from "@/lib/export/shareCardCanvas";
import { GitopsyAnalysis } from "@/types/domain";

describe("buildDeveloperCardData - Gitopsy Developer Card Engine", () => {
  const mockAnalysis: GitopsyAnalysis = {
    id: "test-analysis-12345",
    generatedAt: "2026-08-30T12:00:00Z",
    isIncremental: false,
    durationMs: 1200,
    subjectLogin: "monojitgoswami",
    subject: {
      login: "monojitgoswami",
      name: "Monojit Goswami",
      avatarUrl: "https://avatars.githubusercontent.com/u/1?v=4",
      bio: "Building developer intelligence tools",
      company: null,
      location: "India",
      createdAt: "2020-01-01T00:00:00Z",
      publicRepos: 12,
      totalPrivateRepos: 4,
      followers: 120,
      following: 50,
    },
    summary: {
      totalCommits: 1247,
      totalContributions: 1400,
      reposAnalyzed: 14,
      reposSkipped: 0,
      activeRepos: 8,
      linesAdded: 45000,
      linesDeleted: 12000,
      netLines: 33000,
      prsAuthored: 42,
      prsMerged: 38,
      mergeRatePercentage: 90,
      issuesAuthored: 15,
      reviewsAuthored: 24,
      starsReceived: 88,
      forksReceived: 14,
      longestStreakDays: 47,
      activeStreakDays: 5,
      totalActiveDays: 140,
      longestInactiveGapDays: 12,
      peakDailyCommits: 22,
      averageDailyCommits: 8.9,
      multiContributorRepoShare: 40,
      functionalLanguageCount: 4,
      busiestHour: 2,
      busiestWeekday: "Tuesday",
      busiestMonth: "2026-03",
      nightCommitPercentage: 62,
      weekendCommitPercentage: 28,
      timezone: "Asia/Kolkata",
      timezoneAbbr: "IST",
    },
    activity: {
      heatmapCalendar: [],
      byHour: new Array(24).fill(10),
      byWeekday: [10, 20, 30, 25, 20, 15, 10],
      byMonth: [],
      longestInactiveGapDays: 12,
      peakDailyCommits: 22,
    },
    repositories: [
      {
        id: 1,
        name: "super-secret-top-repo",
        fullName: "monojitgoswami/super-secret-top-repo",
        isPrivate: false,
        isFork: false,
        isArchived: false,
        defaultBranch: "main",
        stars: 450,
        forks: 88,
        openIssues: 2,
        createdAt: "2025-01-01T00:00:00Z",
        lastPushedAt: "2026-08-30T00:00:00Z",
        primaryLanguage: "TypeScript",
        languages: [{ name: "TypeScript", bytes: 100000, percentage: 85 }],
        commitCount: 650,
        additions: 30000,
        deletions: 8000,
        netLines: 22000,
        prsAuthored: 20,
        prsMerged: 18,
        issuesAuthored: 5,
        activitySpanDays: 200,
        daysSinceLastPush: 1,
        fetchStatus: "ok",
        fetchWarnings: [],
      },
    ],
    languages: [
      { name: "TypeScript", bytes: 150000, percentage: 65, repoCount: 8, isFunctional: true },
      { name: "Python", bytes: 50000, percentage: 25, repoCount: 4, isFunctional: true },
    ],
    commitForensics: {
      totalAnalyzed: 1247,
      detailedCommitsCount: 150,
      averageAdditionsPerCommit: 35,
      averageDeletionsPerCommit: 10,
      medianCommitSize: 22,
      averageMessageLength: 28,
      churnRatio: 0.21,
      sizeDistribution: { tiny: 50, small: 60, medium: 30, large: 8, monster: 2 },
      messageCategories: [{ category: "FEAT", count: 60, percentage: 50 }],
      shortMessageCount: 12,
      longMessageCount: 5,
      repeatedMessageCount: 2,
      conventionalCommitCount: 750,
      remarks: [],
      largestCommit: {
        sha: "abc1234deadbeef",
        repoFullName: "monojitgoswami/super-secret-top-repo",
        message: "feat: core analysis engine overhaul",
        additions: 2400,
        deletions: 800,
        filesChanged: 14,
      },
    },
    classifications: [],
    primaryClassification: {
      id: "night-owl",
      title: "NIGHT OWL",
      tagline: "Late-night coding cadence.",
      description: "62% of commits recorded past 21:00.",
      badgeAccent: "#C084FC",
      evidenceStrength: "VERY HIGH",
      evidence: [],
    },
    awards: [],
    courtCharges: [],
    findings: [],
    easterEggs: [],
    diagnostics: {
      failedRepos: [],
      truncatedRepos: [],
      rateLimitHitCount: 0,
      schedulerMaxRetries: 3,
      graphqlContributionCalendarAvailable: true,
      warnings: [],
    },
  };

  it("should generate a valid Developer Card payload", () => {
    const card = buildDeveloperCardData(mockAnalysis);
    expect(card).toBeDefined();
    expect(card.username).toBe("monojitgoswami");
    expect(card.primaryClassification).toBe("NIGHT OWL");
    expect(card.classificationMetric).toBe("62% AFTER DARK");
    expect(card.caseNote.length).toBeGreaterThan(0);
    expect(card.fileNo).toMatch(/^CASE FILE #[0-9A-F]{4}$/);
    expect(card.totalCommits).toBe(1247);
    expect(card.activeDays).toBe(140);
    expect(card.longestStreak).toBe(47);
    expect(card.topLanguage).toBe("TypeScript");
    expect(card.codeDna.length).toBeGreaterThan(0);
    expect(card.memberSinceYear).toBe(2020);
  });

  it("CRITICAL: should have ZERO repository-specific data leakage", () => {
    const card = buildDeveloperCardData(mockAnalysis);
    const cardPayloadString = JSON.stringify(card);

    // Assert that no repository name or commit SHA appears in the card
    expect(cardPayloadString).not.toContain("super-secret-top-repo");
    expect(cardPayloadString).not.toContain("abc1234deadbeef");
    expect(cardPayloadString).not.toContain("450 stars");
  });

  it("CRITICAL: should have at most FOUR supporting statistics", () => {
    const card = buildDeveloperCardData(mockAnalysis);
    expect(card.supportingStats.length).toBeLessThanOrEqual(4);
    expect(card.supportingStats.length).toBeGreaterThanOrEqual(1);
  });

  it("should select quotes deterministically", () => {
    const card1 = buildDeveloperCardData(mockAnalysis);
    const card2 = buildDeveloperCardData(mockAnalysis);
    expect(card1.caseNote).toBe(card2.caseNote);
  });

  it("should gracefully handle low-data / early cases without manufacturing fake findings", () => {
    const earlyAnalysis: GitopsyAnalysis = {
      ...mockAnalysis,
      summary: {
        ...mockAnalysis.summary,
        totalCommits: 7,
        totalActiveDays: 2,
        longestStreakDays: 1,
        nightCommitPercentage: 0,
        weekendCommitPercentage: 0,
      },
      commitForensics: {
        ...mockAnalysis.commitForensics,
        largestCommit: null,
      },
    };

    const card = buildDeveloperCardData(earlyAnalysis);
    expect(card.primaryClassification).toBe("EARLY EVIDENCE");
    expect(card.caseNote).toBe("More history remains to be examined.");
    expect(card.supportingStats.length).toBeLessThanOrEqual(4);
  });

  it("should render canonical portrait 4:5 card without throwing", () => {
    const card = buildDeveloperCardData(mockAnalysis);
    const mockCtx = {
      save: () => {},
      restore: () => {},
      clearRect: () => {},
      fillRect: () => {},
      strokeRect: () => {},
      fillText: () => {},
      beginPath: () => {},
      closePath: () => {},
      moveTo: () => {},
      lineTo: () => {},
      arc: () => {},
      stroke: () => {},
      fill: () => {},
      measureText: (text: string) => ({ width: text.length * 10 }),
      drawImage: () => {},
    } as unknown as CanvasRenderingContext2D;

    expect(() => drawDeveloperCard(mockCtx, card, null)).not.toThrow();
  });
});
