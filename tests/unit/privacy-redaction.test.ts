import { describe, it, expect, vi } from "vitest";
import { ForensicDataSanitizer } from "@/lib/db/exportImport";
import { gitopsyDb } from "@/lib/db";
import { GitopsyAnalysis } from "@/types/domain";

describe("Forensic Privacy Redaction Engine", () => {
  it("should completely strip tokens, authorization headers, and secrets from export structures", () => {
    const dirtyData = {
      profile: { login: "testuser" },
      token: "ghp_superSecretToken12345",
      access_token: "gho_anotherSecretToken",
      code_verifier: "pkce_verifier_secret_12345",
      authorization: "Bearer secret",
      oauth_state: "state_123",
      safeData: {
        commits: 120,
        repositories: ["repo1", "repo2"],
      },
    };

    const sanitized = ForensicDataSanitizer.sanitizeExportData(dirtyData);
    const jsonString = JSON.stringify(sanitized);

    expect(jsonString).not.toContain("ghp_superSecretToken12345");
    expect(jsonString).not.toContain("gho_anotherSecretToken");
    expect(jsonString).not.toContain("pkce_verifier_secret_12345");
    expect(jsonString).not.toContain("Bearer secret");
    expect(sanitized.token).toBeUndefined();
    expect(sanitized.safeData.commits).toBe(120);
  });

  it("should validate and restore complete analysis dossiers including COLLABORATION findings and all summary metrics", async () => {
    const fullAnalysis: GitopsyAnalysis = {
      id: "test-analysis-001",
      generatedAt: "2026-08-30T12:00:00Z",
      isIncremental: false,
      durationMs: 1200,
      subjectLogin: "octocat",
      subject: {
        login: "octocat",
        name: "The Octocat",
        avatarUrl: "https://github.com/octocat.png",
        bio: "GitHub mascot and developer",
        company: "GitHub",
        location: "San Francisco",
        createdAt: "2011-01-25T18:44:36Z",
        publicRepos: 8,
        totalPrivateRepos: 2,
        followers: 1000,
        following: 10,
      },
      summary: {
        totalCommits: 500,
        totalContributions: 550,
        reposAnalyzed: 5,
        reposSkipped: 0,
        activeRepos: 4,
        linesAdded: 15000,
        linesDeleted: 5000,
        netLines: 10000,
        prsAuthored: 25,
        prsMerged: 20,
        mergeRatePercentage: 80,
        issuesAuthored: 12,
        reviewsAuthored: 30,
        starsReceived: 150,
        forksReceived: 45,
        longestStreakDays: 14,
        activeStreakDays: 3,
        totalActiveDays: 85,
        longestInactiveGapDays: 12,
        peakDailyCommits: 22,
        averageDailyCommits: 5.8,
        multiContributorRepoShare: 60,
        functionalLanguageCount: 3,
        timezone: "Asia/Kolkata",
        timezoneAbbr: "IST",
        busiestHour: 14,
        busiestWeekday: "Wednesday",
        busiestMonth: "2026-05",
        nightCommitPercentage: 15,
        weekendCommitPercentage: 10,
      },
      activity: {
        heatmapCalendar: [
          { date: "2026-05-10", count: 8, additions: 200, deletions: 50 },
        ],
        byHour: new Array(24).fill(2),
        byWeekday: new Array(7).fill(5),
        byMonth: [
          { month: "2026-05", commits: 50, additions: 1200, deletions: 400 },
        ],
        longestInactiveGapDays: 12,
        peakDailyCommits: 22,
        timezone: "Asia/Kolkata",
        timezoneAbbr: "IST",
      },
      repositories: [
        {
          id: 101,
          name: "Spoon-Knife",
          fullName: "octocat/Spoon-Knife",
          isPrivate: false,
          isFork: false,
          isArchived: false,
          defaultBranch: "main",
          stars: 120,
          forks: 40,
          openIssues: 2,
          createdAt: "2011-01-27T19:30:43Z",
          lastPushedAt: "2026-08-25T10:00:00Z",
          primaryLanguage: "TypeScript",
          languages: [{ name: "TypeScript", bytes: 50000, percentage: 100 }],
          commitCount: 150,
          additions: 8000,
          deletions: 2000,
          netLines: 6000,
          prsAuthored: 10,
          prsMerged: 10,
          issuesAuthored: 2,
          activitySpanDays: 400,
          daysSinceLastPush: 5,
          fetchStatus: "ok",
          fetchWarnings: [],
        },
      ],
      commitForensics: {
        totalAnalyzed: 150,
        detailedCommitsCount: 100,
        averageAdditionsPerCommit: 53,
        averageDeletionsPerCommit: 13,
        medianCommitSize: 25,
        averageMessageLength: 32,
        churnRatio: 0.2,
        sizeDistribution: {
          tiny: 20,
          small: 50,
          medium: 25,
          large: 5,
          monster: 0,
        },
        messageCategories: [
          { category: "FEAT", count: 80, percentage: 53 },
          { category: "FIX", count: 40, percentage: 27 },
        ],
        shortMessageCount: 5,
        longMessageCount: 15,
        repeatedMessageCount: 2,
        conventionalCommitCount: 95,
        remarks: [],
        largestCommit: {
          sha: "abcdef123456",
          repoFullName: "octocat/Spoon-Knife",
          message: "feat: initial foundation architecture",
          additions: 1200,
          deletions: 150,
          filesChanged: 12,
          authorDate: "2026-05-10T10:00:00Z",
        },
        topVolumeCommits: [
          {
            sha: "abcdef123456",
            repoFullName: "octocat/Spoon-Knife",
            message: "feat: initial foundation architecture",
            additions: 1200,
            deletions: 150,
            filesChanged: 12,
            authorDate: "2026-05-10T10:00:00Z",
          },
        ],
      },
      languages: [
        { name: "TypeScript", bytes: 50000, percentage: 100, repoCount: 1, isFunctional: true },
      ],
      classifications: [],
      primaryClassification: {
        id: "code-artisan",
        title: "Code Artisan",
        tagline: "Crafted commits",
        description: "High craft",
        badgeAccent: "#FFDC58",
        evidenceStrength: "HIGH",
        evidence: [],
      },
      awards: [],
      courtCharges: [],
      findings: [
        {
          id: "finding-merge-rate",
          icon: "GitMerge",
          title: "PR Merge Rate",
          evidence: "20 of 25 pull requests were merged (80% merge rate).",
          category: "COLLABORATION",
        },
      ],
      easterEggs: [],
      diagnostics: {
        failedRepos: [],
        truncatedRepos: [],
        rateLimitHitCount: 0,
        schedulerMaxRetries: 3,
        graphqlContributionCalendarAvailable: false,
        warnings: [],
      },
    };

    const json = JSON.stringify(fullAnalysis);
    const imported = await ForensicDataSanitizer.importAutopsyJson(json);

    expect(imported.id).toBe("test-analysis-001");
    expect(imported.findings[0].category).toBe("COLLABORATION");
    expect(imported.summary.timezone).toBe("Asia/Kolkata");
    expect(imported.summary.timezoneAbbr).toBe("IST");
    expect(imported.summary.peakDailyCommits).toBe(22);
    expect(imported.commitForensics.averageMessageLength).toBe(32);
    expect(imported.commitForensics.topVolumeCommits).toHaveLength(1);
    expect(imported.commitForensics.topVolumeCommits![0].sha).toBe("abcdef123456");
  });

  it("should purge all IndexedDB tables including checkpoints", async () => {
    const clearAnalyses = vi.spyOn(gitopsyDb.analyses, "clear").mockResolvedValue(undefined as any);
    const clearCheckpoints = vi.spyOn(gitopsyDb.checkpoints, "clear").mockResolvedValue(undefined as any);
    const clearSyncState = vi.spyOn(gitopsyDb.syncState, "clear").mockResolvedValue(undefined as any);

    await ForensicDataSanitizer.purgeAllForensicData();

    expect(clearAnalyses).toHaveBeenCalledTimes(1);
    expect(clearCheckpoints).toHaveBeenCalledTimes(1);
    expect(clearSyncState).toHaveBeenCalledTimes(1);

    clearAnalyses.mockRestore();
    clearCheckpoints.mockRestore();
    clearSyncState.mockRestore();
  });

  it("preserves authorship fields (authorDate) while stripping exact auth keys", () => {
    const sanitized = ForensicDataSanitizer.sanitizeExportData({
      remark: { sha: "abc", authorDate: "2026-01-01T00:00:00Z" },
      auth: "should-still-be-stripped",
      authorization: "Bearer x",
    });

    expect((sanitized as any).remark.authorDate).toBe("2026-01-01T00:00:00Z");
    expect((sanitized as any).auth).toBeUndefined();
    expect((sanitized as any).authorization).toBeUndefined();
  });

  it("round-trips a report containing forensic remarks (authorDate must survive export + re-import)", async () => {
    const base = JSON.parse(
      JSON.stringify({
        id: "roundtrip-remarks-1",
        generatedAt: "2026-08-30T12:00:00Z",
        isIncremental: false,
        durationMs: 100,
        subjectLogin: "octocat",
        subject: {
          login: "octocat",
          name: null,
          avatarUrl: "https://github.com/octocat.png",
          bio: null,
          company: null,
          location: null,
          createdAt: "2011-01-25T18:44:36Z",
          publicRepos: 1,
          totalPrivateRepos: 0,
          followers: 0,
          following: 0,
        },
        summary: {
          totalCommits: 10,
          totalContributions: 10,
          reposAnalyzed: 1,
          reposSkipped: 0,
          activeRepos: 1,
          linesAdded: 100,
          linesDeleted: 20,
          netLines: 80,
          prsAuthored: 0,
          prsMerged: 0,
          mergeRatePercentage: null,
          issuesAuthored: 0,
          reviewsAuthored: 0,
          starsReceived: 0,
          forksReceived: 0,
          longestStreakDays: 1,
          activeStreakDays: 1,
          totalActiveDays: 2,
          longestInactiveGapDays: 0,
          peakDailyCommits: 5,
          averageDailyCommits: 5,
          multiContributorRepoShare: 0,
          functionalLanguageCount: 1,
          timezone: "UTC",
          timezoneAbbr: "UTC",
          busiestHour: 9,
          busiestWeekday: "Monday",
          busiestMonth: "2026-05",
          nightCommitPercentage: 0,
          weekendCommitPercentage: 0,
        },
        activity: {
          heatmapCalendar: [],
          byHour: new Array(24).fill(0),
          byWeekday: new Array(7).fill(0),
          byMonth: [],
          longestInactiveGapDays: 0,
          peakDailyCommits: 5,
          timezone: "UTC",
          timezoneAbbr: "UTC",
        },
        repositories: [],
        languages: [],
        commitForensics: {
          totalAnalyzed: 10,
          detailedCommitsCount: 5,
          averageAdditionsPerCommit: 20,
          averageDeletionsPerCommit: 4,
          medianCommitSize: 24,
          averageMessageLength: 12,
          churnRatio: 0.17,
          sizeDistribution: { tiny: 1, small: 2, medium: 1, large: 1, monster: 0 },
          messageCategories: [{ category: "WIP", count: 3, percentage: 30 }],
          shortMessageCount: 2,
          longMessageCount: 0,
          repeatedMessageCount: 0,
          conventionalCommitCount: 0,
          remarks: [
            {
              id: "remark-sha1",
              sha: "sha1",
              repoFullName: "octocat/r",
              authorDate: "2026-05-01T03:00:00Z",
              message: "wip",
              remarkTitle: "WIP Checkpoint",
              remarkText: "Checkpoint commit pushed to octocat/r.",
              type: "WIP",
            },
          ],
          largestCommit: null,
          topVolumeCommits: [],
        },
        classifications: [],
        awards: [],
        courtCharges: [],
        findings: [],
        easterEggs: [],
        diagnostics: {
          failedRepos: [],
          truncatedRepos: [],
          rateLimitHitCount: 0,
          schedulerMaxRetries: 3,
          graphqlContributionCalendarAvailable: false,
          warnings: [],
        },
      })
    );

    const exportedJson = JSON.stringify(ForensicDataSanitizer.sanitizeExportData(base));
    const imported = await ForensicDataSanitizer.importAutopsyJson(exportedJson);

    expect(imported.commitForensics.remarks).toHaveLength(1);
    expect(imported.commitForensics.remarks[0].authorDate).toBe("2026-05-01T03:00:00Z");
  });
});

