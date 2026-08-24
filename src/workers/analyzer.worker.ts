/**
 * GITOPSY BACKGROUND ANALYZER WEB WORKER
 * Offloads heavy network fetching, pagination, metrics normalization, and aggregation
 * completely off the React main UI thread.
 */

import { WorkerInMessage, WorkerOutMessage, GitopsyAnalysis, ForensicCommit, RepositoryAnalysis } from "@/types/domain";
import { ForensicGitHubClient } from "@/lib/github/client";
import { ForensicGitHubRest } from "@/lib/github/rest";
import { calculateTemporalAnalytics } from "@/lib/analytics/temporal";
import { calculateCodeChurnAnalytics } from "@/lib/analytics/churn";
import { analyzeCommitForensics } from "@/lib/analytics/commitForensics";
import { computeDeveloperClassifications } from "@/lib/analytics/classifications";
import { generateRepositoryAwards } from "@/lib/analytics/awards";
import { generateCourtCharges } from "@/lib/analytics/court";
import { generateDeterministicFindings } from "@/lib/analytics/funFacts";
import { detectDeterministicEasterEggs } from "@/lib/analytics/easterEggs";

const FORENSIC_LOADING_QUOTES = [
  "Examining GitHub author signatures...",
  "Auditing repository commit histories...",
  "Calculating 24-hour UTC activity distribution...",
  "Analyzing additions vs deletions code churn...",
  "Parsing commit message categorizations...",
  "Evaluating deterministic developer classifications...",
  "Preparing the People vs Defendant court docket...",
  "Synthesizing the complete forensic dossier...",
];

function post(msg: WorkerOutMessage) {
  self.postMessage(msg);
}

self.onmessage = async (event: MessageEvent<WorkerInMessage>) => {
  const data = event.data;

  if (data.type === "START_ANALYSIS") {
    const { token, username, sinceDate } = data.payload;
    const startTime = Date.now();

    try {
      const client = new ForensicGitHubClient({
        token,
        maxConcurrency: 10,
        baseDelayMs: 200,
        onRateLimitWarning: (status, message) => {
          post({
            type: "RATE_LIMIT",
            payload: {
              resetAt: status.resetTimeIso,
              waitSeconds: Math.max(1, status.resetTimeEpoch - Math.floor(Date.now() / 1000)),
              message,
            },
          });
        },
      });

      const rest = new ForensicGitHubRest(client);

      post({
        type: "PROGRESS",
        payload: {
          phase: "IDENTIFICATION",
          currentItem: "GitHub Profile",
          current: 1,
          total: 10,
          percentage: 10,
          message: "Summoning subject profile and metadata...",
        },
      });

      const profile = await rest.getAuthenticatedUser();
      const targetUser = username || profile.login;

      post({
        type: "PROGRESS",
        payload: {
          phase: "DISCOVERY",
          currentItem: "Repositories",
          current: 2,
          total: 10,
          percentage: 25,
          message: `Discovering accessible repositories for @${targetUser}...`,
        },
      });

      const rawRepos = await rest.getRepositories(sinceDate);
      const reposToScan = rawRepos.filter((r) => !r.isArchived);
      const totalReposToScan = reposToScan.length;

      const allCommits: ForensicCommit[] = [];
      const seenCommitShas = new Set<string>();
      const languageMap = new Map<string, { bytes: number; repoCount: number }>();
      const processedRepos: RepositoryAnalysis[] = [];
      
      const CONCURRENCY_LIMIT = 10;
      let completedReposCount = 0;

      async function processSingleRepo(r: (typeof reposToScan)[0], index: number): Promise<{
        repoAnalysis: RepositoryAnalysis;
        commits: ForensicCommit[];
      }> {
        // Fetch all repo resources concurrently in parallel
        const [repoCommits, contribStats, prs, issues, languages] = await Promise.all([
          rest.getRepoCommits(r.fullName!, targetUser, sinceDate, 200),
          rest.getRepoContributorStats(r.fullName!, targetUser),
          rest.getRepoPullRequests(r.fullName!, targetUser, sinceDate),
          rest.getRepoIssues(r.fullName!, targetUser, sinceDate),
          rest.getRepoLanguages(r.fullName!),
        ]);

        // Filter and deduplicate commits
        const uniqueRepoCommits: ForensicCommit[] = [];
        for (const c of repoCommits) {
          if (!seenCommitShas.has(c.sha)) {
            seenCommitShas.add(c.sha);
            uniqueRepoCommits.push(c);
          }
        }

        // Fetch commit details for top 5 recent commits concurrently
        const commitsToDetail = Math.min(uniqueRepoCommits.length, 5);
        if (commitsToDetail > 0) {
          await Promise.all(
            uniqueRepoCommits.slice(0, commitsToDetail).map(async (c) => {
              const detail = await rest.getCommitDetails(r.fullName!, c.sha);
              c.additions = detail.additions;
              c.deletions = detail.deletions;
              c.filesChanged = detail.filesChanged;
            })
          );
        }

        // Register languages
        languages.forEach((lang) => {
          const current = languageMap.get(lang.name) || { bytes: 0, repoCount: 0 };
          current.bytes += lang.bytes;
          current.repoCount++;
          languageMap.set(lang.name, current);
        });

        const mergedPrs = prs.filter((p) => p.state === "merged").length;

        let repoAdditions = 0;
        let repoDeletions = 0;
        if (contribStats && (contribStats.additions > 0 || contribStats.deletions > 0)) {
          repoAdditions = contribStats.additions;
          repoDeletions = contribStats.deletions;
        } else {
          repoAdditions = uniqueRepoCommits.reduce((acc, c) => acc + c.additions, 0);
          repoDeletions = uniqueRepoCommits.reduce((acc, c) => acc + c.deletions, 0);
        }

        const createdMs = new Date(r.createdAt || Date.now()).getTime();
        const pushedMs = new Date(r.lastPushedAt || Date.now()).getTime();
        const activitySpanDays = Math.max(1, Math.floor((pushedMs - createdMs) / (1000 * 60 * 60 * 24)));
        const daysSinceLastPush = Math.max(
          0,
          Math.floor((Date.now() - pushedMs) / (1000 * 60 * 60 * 24))
        );

        completedReposCount++;
        const pct = 25 + Math.round((completedReposCount / Math.max(1, totalReposToScan)) * 55);

        post({
          type: "PROGRESS",
          payload: {
            phase: "AUTOPSY",
            currentItem: r.fullName || "repository",
            current: completedReposCount,
            total: totalReposToScan,
            percentage: pct,
            message: `Examining specimen ${completedReposCount}/${totalReposToScan}: ${r.name}...`,
            rateLimitRemaining: client.getRateLimitStatus().remaining,
          },
        });

        return {
          repoAnalysis: {
            id: r.id || index + 1,
            name: r.name || "repo",
            fullName: r.fullName || `${targetUser}/${r.name}`,
            isPrivate: Boolean(r.isPrivate),
            isFork: Boolean(r.isFork),
            isArchived: Boolean(r.isArchived),
            defaultBranch: r.defaultBranch || "main",
            stars: r.stars || 0,
            forks: r.forks || 0,
            openIssues: r.openIssues || 0,
            createdAt: r.createdAt || new Date().toISOString(),
            lastPushedAt: r.lastPushedAt || new Date().toISOString(),
            primaryLanguage: r.primaryLanguage || null,
            languages,
            commitCount: uniqueRepoCommits.length,
            additions: repoAdditions,
            deletions: repoDeletions,
            netLines: repoAdditions - repoDeletions,
            prsAuthored: prs.length,
            prsMerged: mergedPrs,
            issuesAuthored: issues.length,
            activitySpanDays,
            daysSinceLastPush,
          },
          commits: uniqueRepoCommits,
        };
      }

      // Concurrently run 10 parallel repository worker streams
      const pool: Promise<void>[] = [];
      let cursor = 0;

      async function worker() {
        while (cursor < reposToScan.length) {
          const idx = cursor++;
          const repo = reposToScan[idx];
          try {
            const result = await processSingleRepo(repo, idx);
            processedRepos.push(result.repoAnalysis);
            allCommits.push(...result.commits);
          } catch {
            // continue processing other repositories
          }
        }
      }

      for (let i = 0; i < Math.min(CONCURRENCY_LIMIT, reposToScan.length); i++) {
        pool.push(worker());
      }

      await Promise.all(pool);

      post({
        type: "PROGRESS",
        payload: {
          phase: "AGGREGATION",
          currentItem: "Forensic Metrics",
          current: 9,
          total: 10,
          percentage: 85,
          message: "Synthesizing classifications, temporal distributions, and awards...",
        },
      });

      const totalCommits = allCommits.length;
      const totalLinesAdded = processedRepos.reduce((acc, r) => acc + r.additions, 0);
      const totalLinesDeleted = processedRepos.reduce((acc, r) => acc + r.deletions, 0);
      const totalPrsAuthored = processedRepos.reduce((acc, r) => acc + r.prsAuthored, 0);
      const totalPrsMerged = processedRepos.reduce((acc, r) => acc + r.prsMerged, 0);
      const totalIssuesAuthored = processedRepos.reduce((acc, r) => acc + r.issuesAuthored, 0);

      // Reviews authored count
      const reviewsCount = await rest.getReviewsCount(targetUser);

      const temporal = calculateTemporalAnalytics(allCommits);
      const churn = calculateCodeChurnAnalytics(allCommits);
      if (totalLinesAdded > 0) {
        churn.totalAdditions = totalLinesAdded;
        churn.totalDeletions = totalLinesDeleted;
        churn.netLines = totalLinesAdded - totalLinesDeleted;
        churn.churnRatio = totalLinesAdded > 0 ? Math.round((totalLinesDeleted / totalLinesAdded) * 100) / 100 : 0;
      }
      const commitForensics = analyzeCommitForensics(allCommits, targetUser);

      const totalBytes = Array.from(languageMap.values()).reduce((acc, v) => acc + v.bytes, 0);
      const languageAnalysis = Array.from(languageMap.entries())
        .map(([name, data]) => ({
          name,
          bytes: data.bytes,
          percentage: totalBytes > 0 ? Math.round((data.bytes / totalBytes) * 100) : 0,
          repoCount: data.repoCount,
        }))
        .sort((a, b) => b.bytes - a.bytes);

      const summary = {
        totalCommits,
        reposAnalyzed: processedRepos.length,
        activeRepos: processedRepos.filter((r) => r.daysSinceLastPush <= 90).length,
        linesAdded: totalLinesAdded,
        linesDeleted: totalLinesDeleted,
        netLines: totalLinesAdded - totalLinesDeleted,
        prsAuthored: totalPrsAuthored,
        prsMerged: totalPrsMerged,
        mergeRatePercentage: totalPrsAuthored > 0 ? Math.round((totalPrsMerged / totalPrsAuthored) * 100) : 100,
        issuesAuthored: totalIssuesAuthored,
        reviewsAuthored: reviewsCount,
        starsReceived: processedRepos.reduce((acc, r) => acc + r.stars, 0),
        forksReceived: processedRepos.reduce((acc, r) => acc + r.forks, 0),
        longestStreakDays: temporal.longestStreakDays,
        activeStreakDays: temporal.activeStreakDays,
        totalActiveDays: temporal.totalActiveDays,
        busiestHour: temporal.busiestHour,
        busiestWeekday: temporal.busiestWeekday,
        busiestMonth: temporal.busiestMonth,
        nightCommitPercentage: temporal.nightCommitPercentage,
        weekendCommitPercentage: temporal.weekendCommitPercentage,
      };

      const classifications = computeDeveloperClassifications({
        commits: allCommits,
        repositories: processedRepos,
        temporal: {
          heatmapCalendar: temporal.heatmapCalendar,
          byHour: temporal.commitsByHour,
          byWeekday: temporal.commitsByWeekday,
          byMonth: temporal.commitsByMonth.map((m) => ({
            month: m.month,
            commits: m.count,
            additions: m.additions,
            deletions: m.deletions,
          })),
        },
        summary,
        churn: {
          churnRatio: churn.churnRatio,
          totalDeletions: totalLinesDeleted,
          totalAdditions: totalLinesAdded,
        },
        languageCount: languageAnalysis.length,
        commitCategories: commitForensics.messageCategories,
      });

      const awards = generateRepositoryAwards(processedRepos, totalCommits);

      const partialAnalysis: Partial<GitopsyAnalysis> = {
        subject: profile,
        summary,
        repositories: processedRepos,
        languages: languageAnalysis,
        commitForensics,
      };

      const courtCharges = generateCourtCharges(partialAnalysis, targetUser);
      const findings = generateDeterministicFindings(partialAnalysis);
      const easterEggs = detectDeterministicEasterEggs(partialAnalysis, allCommits);

      const finalReport: GitopsyAnalysis = {
        id: `dossier-${targetUser}-${Date.now()}`,
        generatedAt: new Date().toISOString(),
        isIncremental: Boolean(sinceDate),
        durationMs: Date.now() - startTime,
        subject: profile,
        summary,
        activity: {
          heatmapCalendar: temporal.heatmapCalendar,
          byHour: temporal.commitsByHour,
          byWeekday: temporal.commitsByWeekday,
          byMonth: temporal.commitsByMonth.map((m) => ({
            month: m.month,
            commits: m.count,
            additions: m.additions,
            deletions: m.deletions,
          })),
        },
        repositories: processedRepos,
        languages: languageAnalysis,
        commitForensics,
        classifications,
        primaryClassification: classifications[0],
        awards,
        courtCharges,
        findings,
        easterEggs,
      };

      post({ type: "COMPLETE", payload: { report: finalReport } });
    } catch (err) {
      post({ type: "ERROR", payload: { error: String(err) } });
    }
  }
};
