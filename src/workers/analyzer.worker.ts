/**
 * GITOPSY BACKGROUND ANALYZER WEB WORKER
 *
 * Checkpoint & Resume Architecture:
 * - A checkpoint is saved to IndexedDB every 10 processed repos, and again
 *   if the GitHub rate limit reset is > 5 minutes away (longPauseThreshold).
 * - If the scheduler aborts all in-flight tasks with a resumable error,
 *   the worker saves a final checkpoint and posts RESUME_AVAILABLE with the
 *   resume timestamp. The user can resume later (timer or manual button).
 * - On RESUME, the worker reconstructs state from the checkpoint and
 *   processes remaining repos (including previously-failed ones).
 * - No repo is permanently dropped: failed repos are retried on every resume.
 * - Successful completion deletes the checkpoint.
 */

import {
  WorkerInMessage,
  WorkerOutMessage,
  GitopsyAnalysis,
  ForensicCommit,
  RepositoryAnalysis,
  RepoFailureEntry,
  AnalysisDiagnostics,
  AnalysisCheckpoint,
  SubjectProfile,
} from "@/types/domain";
import { ForensicGitHubClient } from "@/lib/github/client";
import { ForensicGitHubRest, RestRepoSummary } from "@/lib/github/rest";
import { ForensicGitHubGraphQL } from "@/lib/github/graphql";
import { selectDetailIndices } from "@/lib/github/detailSampling";
import { gitopsyDb } from "@/lib/db";
import { isResumableRateLimitError, isAuthError } from "@/lib/github/errors";
import { calculateTemporalAnalytics } from "@/lib/analytics/temporal";
import { calculateCodeChurnAnalytics } from "@/lib/analytics/churn";
import { analyzeCommitForensics } from "@/lib/analytics/commitForensics";
import { computeDeveloperClassifications } from "@/lib/analytics/classifications";
import { generateRepositoryAwards } from "@/lib/analytics/awards";
import { generateCourtCharges } from "@/lib/analytics/court";
import { generateDeterministicFindings } from "@/lib/analytics/funFacts";
import { detectDeterministicEasterEggs } from "@/lib/analytics/easterEggs";

function post(msg: WorkerOutMessage) {
  self.postMessage(msg);
}

function postProgress(
  phase: string,
  currentItem: string,
  current: number,
  total: number,
  percentage: number,
  message: string,
  rateLimitRemaining?: number
) {
  post({
    type: "PROGRESS",
    payload: { phase, currentItem, current, total, percentage, message, rateLimitRemaining },
  });
}

function postRepoWarning(repoFullName: string, phase: string, error: string) {
  post({ type: "REPO_WARNING", payload: { repoFullName, phase, error } });
}

function postLog(level: "info" | "warn" | "error", message: string) {
  post({ type: "LOG", payload: { level, message } });
}

let cancelled = false;

interface AnalysisState {
  checkpointId: string;
  subjectLogin: string;
  startedAt: number;
  sinceDate?: string;
  isIncremental: boolean;
  concurrency: number;

  profile: SubjectProfile | null;
  reposToScan: RestRepoSummary[];

  processedRepoFullNames: Set<string>;
  processedRepos: RepositoryAnalysis[];
  allCommits: ForensicCommit[];
  allWeeks: { w: number; a: number; d: number; c: number }[];
  languageMap: Map<string, { bytes: number; repoCount: number }>;
  seenCommitShasGlobal: Set<string>;

  failedRepos: RepoFailureEntry[];
  truncatedRepos: RepoFailureEntry[];
  rateLimitHitCount: number;
  diagnosticsWarnings: string[];
  graphqlContributionCalendarAvailable: boolean;

  checkpointTriggered: boolean;
  rateLimitResetEpoch: number;
  resumeAtIso: string;
  resumeReason: string;
  timezone?: string;
  timezoneAbbr?: string;

  /** Set when a fatal (auth) error aborts the pipeline; posted as ERROR. */
  fatalError: string | null;
}

function newState(checkpointId: string, subjectLogin: string, concurrency: number): AnalysisState {
  return {
    checkpointId,
    subjectLogin,
    startedAt: Date.now(),
    sinceDate: undefined,
    isIncremental: false,
    concurrency,
    profile: null,
    reposToScan: [],
    processedRepoFullNames: new Set(),
    processedRepos: [],
    allCommits: [],
    allWeeks: [],
    languageMap: new Map(),
    seenCommitShasGlobal: new Set(),
    failedRepos: [],
    truncatedRepos: [],
    rateLimitHitCount: 0,
    diagnosticsWarnings: [],
    graphqlContributionCalendarAvailable: false,
    checkpointTriggered: false,
    rateLimitResetEpoch: 0,
    resumeAtIso: "",
    resumeReason: "",
    timezone: undefined,
    timezoneAbbr: undefined,
    fatalError: null,
  };
}

async function saveCheckpoint(state: AnalysisState): Promise<void> {
  const checkpoint: AnalysisCheckpoint = {
    checkpointId: state.checkpointId,
    subjectLogin: state.subjectLogin,
    startedAt: new Date(state.startedAt).toISOString(),
    lastSavedAt: new Date().toISOString(),
    sinceDate: state.sinceDate,
    isIncremental: state.isIncremental,
    maxConcurrency: state.concurrency,
    profile: state.profile,
    reposToScan: state.reposToScan.map((r) => ({
      id: r.id,
      name: r.name,
      fullName: r.fullName,
      isPrivate: r.isPrivate,
      isFork: r.isFork,
      isArchived: r.isArchived,
      defaultBranch: r.defaultBranch,
      stars: r.stars,
      forks: r.forks,
      openIssues: r.openIssues,
      sizeKb: r.sizeKb,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      lastPushedAt: r.lastPushedAt,
      primaryLanguage: r.primaryLanguage,
      topics: r.topics,
    })),
    processedRepoFullNames: Array.from(state.processedRepoFullNames),
    failedRepos: state.failedRepos,
    truncatedRepos: state.truncatedRepos,
    processedRepos: state.processedRepos,
    allCommits: state.allCommits,
    allWeeks: state.allWeeks,
    languageMapEntries: Array.from(state.languageMap.entries()),
    rateLimitHitCount: state.rateLimitHitCount,
    diagnosticsWarnings: state.diagnosticsWarnings,
    graphqlContributionCalendarAvailable: state.graphqlContributionCalendarAvailable,
    rateLimitResetEpoch: state.rateLimitResetEpoch,
    resumeAt: state.resumeAtIso,
    resumeReason: state.resumeReason,
    timezone: state.timezone,
    timezoneAbbr: state.timezoneAbbr,
  };

  try {
    await gitopsyDb.checkpoints.put(checkpoint);
    post({
      type: "CHECKPOINT_SAVED",
      payload: {
        checkpointId: state.checkpointId,
        reposProcessed: state.processedRepoFullNames.size,
        reposTotal: state.reposToScan.length,
      },
    });
  } catch (err) {
    postLog("error", `Failed to save checkpoint: ${err instanceof Error ? err.message : String(err)}`);
  }
}

function restoreFromCheckpoint(checkpoint: AnalysisCheckpoint): AnalysisState {
  const state = newState(checkpoint.checkpointId, checkpoint.subjectLogin, checkpoint.maxConcurrency);
  state.startedAt = new Date(checkpoint.startedAt).getTime();
  state.sinceDate = checkpoint.sinceDate;
  state.isIncremental = checkpoint.isIncremental;
  state.profile = checkpoint.profile;
  state.reposToScan = checkpoint.reposToScan;
  state.processedRepoFullNames = new Set(checkpoint.processedRepoFullNames);
  state.processedRepos = [...checkpoint.processedRepos];
  state.allCommits = [...checkpoint.allCommits];
  state.allWeeks = [...checkpoint.allWeeks];
  state.languageMap = new Map(checkpoint.languageMapEntries);
  state.seenCommitShasGlobal = new Set(state.allCommits.map((c) => c.sha));
  state.failedRepos = [...checkpoint.failedRepos];
  state.truncatedRepos = [...checkpoint.truncatedRepos];
  state.rateLimitHitCount = checkpoint.rateLimitHitCount;
  state.diagnosticsWarnings = [...checkpoint.diagnosticsWarnings];
  state.graphqlContributionCalendarAvailable = checkpoint.graphqlContributionCalendarAvailable;
  state.timezone = checkpoint.timezone;
  state.timezoneAbbr = checkpoint.timezoneAbbr;
  return state;
}

async function processSingleRepo(
  state: AnalysisState,
  r: RestRepoSummary,
  index: number,
  rest: ForensicGitHubRest,
  client: ForensicGitHubClient
): Promise<void> {
  const repoWarnings: string[] = [];
  let fetchStatus: RepositoryAnalysis["fetchStatus"] = "ok";

  // Phase 1: fetch commits first. This is the fastest call and determines
  // whether the user has ANY activity in this repo. If 0 commits, skip
  // all other fetches (PRs, issues, languages, contributor stats, details)
  // to save 4+ API calls per dead repo.
  // NO commit cap: every page is fetched so totals match GitHub exactly.
  const commitsOutcome = await rest.getRepoCommits(
    r.fullName!, state.subjectLogin, state.sinceDate
  );

  if (!commitsOutcome.ok) {
    // A repo whose commits could not be fetched contributes no data at all.
    // Record it as failed only — do NOT also push it into processedRepos,
    // which previously double-counted it in reposAnalyzed AND reposSkipped
    // while silently zeroing every summary total it touched.
    repoWarnings.push(`commits: ${commitsOutcome.error}`);
    postRepoWarning(r.fullName!, "COMMITS", commitsOutcome.error || "unknown");
    state.failedRepos.push({ repoFullName: r.fullName!, phase: "COMMITS", error: commitsOutcome.error || "unknown" });
    return;
  }
  if (commitsOutcome.truncated) {
    repoWarnings.push("commits truncated");
    state.truncatedRepos.push({ repoFullName: r.fullName!, phase: "COMMITS", error: "truncated" });
  }

  const repoCommits = commitsOutcome.data;

  // Repos where the subject has 0 commits are not analyzed or counted as contributed repos.
  if (repoCommits.length === 0) {
    state.processedRepoFullNames.add(r.fullName!);
    return;
  }

  let contribStats: Awaited<ReturnType<typeof rest.getRepoContributorStats>>["data"] = null;
  let prs: Awaited<ReturnType<typeof rest.getRepoPullRequests>>["data"] = [];
  let issues: Awaited<ReturnType<typeof rest.getRepoIssues>>["data"] = [];
  let languages: Awaited<ReturnType<typeof rest.getRepoLanguages>>["data"] = [];

  if (!cancelled) {
    // Phase 2: fetch remaining resources only for repos with verified commit activity
    const [contribStatsOutcome, prsOutcome, issuesOutcome, languagesOutcome] = await Promise.all([
      rest.getRepoContributorStats(r.fullName!, state.subjectLogin),
      rest.getRepoPullRequests(r.fullName!, state.subjectLogin, state.sinceDate),
      rest.getRepoIssues(r.fullName!, state.subjectLogin, state.sinceDate),
      rest.getRepoLanguages(r.fullName!),
    ]);

    if (!contribStatsOutcome.ok && contribStatsOutcome.error) {
      // Without contributor stats the churn fallback sums per-commit diff
      // details, which only exist for the sampled subset — the repo's
      // additions/deletions would be silently near-zero. Never present that
      // as fully measured data.
      fetchStatus = "partial";
      repoWarnings.push(`contributorStats: ${contribStatsOutcome.error}`);
      const diagWarning = `Churn data incomplete for ${r.fullName}: ${contribStatsOutcome.error}`;
      if (!state.diagnosticsWarnings.includes(diagWarning)) {
        state.diagnosticsWarnings.push(diagWarning);
      }
    }
    if (!prsOutcome.ok) {
      fetchStatus = fetchStatus === "ok" ? "partial" : fetchStatus;
      repoWarnings.push(`pullRequests: ${prsOutcome.error}`);
    }
    if (!issuesOutcome.ok) {
      fetchStatus = fetchStatus === "ok" ? "partial" : fetchStatus;
      repoWarnings.push(`issues: ${issuesOutcome.error}`);
    }
    if (!languagesOutcome.ok) {
      fetchStatus = fetchStatus === "ok" ? "partial" : fetchStatus;
      repoWarnings.push(`languages: ${languagesOutcome.error}`);
    }

    contribStats = contribStatsOutcome.data;
    prs = prsOutcome.data;
    issues = issuesOutcome.data;
    languages = languagesOutcome.data;

    // PR history deeper than the 10-page cap is bounded by design; record it
    // so the report never presents a capped PR count as complete.
    if (prsOutcome.truncated) {
      repoWarnings.push("pullRequests truncated at 1000 (page cap)");
      const diagWarning = `Pull-request history for ${r.fullName} exceeded the fetch cap (1000 newest PRs); PR metrics are a lower bound.`;
      if (!state.diagnosticsWarnings.includes(diagWarning)) {
        state.diagnosticsWarnings.push(diagWarning);
      }
    }

    // Commit diff details: one API call per commit with no bulk endpoint, so
    // coverage is bounded deliberately — full details for repos at/below the
    // cap, stratified samples across the whole history for larger ones.
    // Summary metrics are unaffected (they come from the uncapped listing and
    // contributor stats); this only feeds insider stats like median size and
    // the size distribution.
    const detailIndices = selectDetailIndices(repoCommits.length);
    if (detailIndices.length > 0 && !cancelled) {
      await Promise.all(
        detailIndices.map(async (idx) => {
          const c = repoCommits[idx];
          const detail = await rest.getCommitDetails(r.fullName!, c.sha);
          if (detail.ok) {
            c.additions = detail.data.additions;
            c.deletions = detail.data.deletions;
            c.filesChanged = detail.data.filesChanged;
            c.hasDetails = true;
          } else {
            c.hasDetails = false;
          }
        })
      );
    }
  }

  languages.forEach((lang) => {
    const current = state.languageMap.get(lang.name) || { bytes: 0, repoCount: 0 };
    current.bytes += lang.bytes;
    current.repoCount++;
    state.languageMap.set(lang.name, current);
  });

  const mergedPrs = prs.filter((p) => p.state === "merged").length;

  let repoAdditions: number;
  let repoDeletions: number;
  if (contribStats && (contribStats.additions > 0 || contribStats.deletions > 0)) {
    repoAdditions = contribStats.additions;
    repoDeletions = contribStats.deletions;
  } else {
    repoAdditions = repoCommits.reduce((acc, c) => acc + c.additions, 0);
    repoDeletions = repoCommits.reduce((acc, c) => acc + c.deletions, 0);
  }

  const createdMs = new Date(r.createdAt || Date.now()).getTime();
  const pushedMs = new Date(r.lastPushedAt || Date.now()).getTime();
  const activitySpanDays = Math.max(1, Math.floor((pushedMs - createdMs) / (1000 * 60 * 60 * 24)));
  const daysSinceLastPush = Math.max(0, Math.floor((Date.now() - pushedMs) / (1000 * 60 * 60 * 24)));

  if (contribStats && contribStats.weeks && contribStats.weeks.length > 0) {
    state.allWeeks.push(...contribStats.weeks);
  }

  try {
    await gitopsyDb.syncState.put({
      repoFullName: r.fullName!,
      lastCommitSha: repoCommits[0]?.sha,
      lastFetchedAt: new Date().toISOString(),
      isComplete: !commitsOutcome.truncated,
    });
  } catch {
    // syncState write is best-effort
  }

  const repoAnalysis: RepositoryAnalysis = {
    id: r.id || index + 1,
    name: r.name || "repo",
    fullName: r.fullName || `${state.subjectLogin}/${r.name}`,
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
    commitCount: repoCommits.length,
    additions: repoAdditions,
    deletions: repoDeletions,
    netLines: repoAdditions - repoDeletions,
    prsAuthored: prs.length,
    prsMerged: mergedPrs,
    issuesAuthored: issues.length,
    activitySpanDays,
    daysSinceLastPush,
    fetchStatus,
    fetchWarnings: repoWarnings,
  };

  state.processedRepos.push(repoAnalysis);
  state.processedRepoFullNames.add(r.fullName!);

  for (const c of repoCommits) {
    if (!state.seenCommitShasGlobal.has(c.sha)) {
      state.seenCommitShasGlobal.add(c.sha);
      state.allCommits.push(c);
    }
  }
}

async function processRepos(
  state: AnalysisState,
  rest: ForensicGitHubRest,
  client: ForensicGitHubClient
): Promise<void> {
  const totalReposToScan = state.reposToScan.length;
  let completedReposCount = state.processedRepoFullNames.size;
  let cursor = 0;

  const remaining = state.reposToScan.filter((r) => !state.processedRepoFullNames.has(r.fullName));

  async function worker() {
    while (cursor < remaining.length && !cancelled && !state.checkpointTriggered && !state.fatalError) {
      const idx = cursor++;
      const repo = remaining[idx];
      try {
        await processSingleRepo(state, repo, idx, rest, client);
      } catch (err) {
        if (isResumableRateLimitError(err)) {
          postLog("warn", `Rate limit pause triggered during repo ${repo.fullName}. Aborting for checkpoint.`);
        } else if (isAuthError(err)) {
          // The token was revoked/expired: every remaining request would fail
          // the same way. Abort with a clear error instead of producing a
          // report where every repo is a failure entry.
          state.fatalError =
            "GitHub authorization expired or revoked. Reconnect your account and run the analysis again.";
          postLog("error", state.fatalError);
          return;
        } else {
          const errorMsg = err instanceof Error ? err.message : String(err);
          postRepoWarning(repo.fullName!, "PROCESSING", errorMsg);
          state.failedRepos.push({ repoFullName: repo.fullName!, phase: "PROCESSING", error: errorMsg });
        }
      } finally {
        completedReposCount++;
        if (completedReposCount % CHECKPOINT_INTERVAL === 0) {
          queueCheckpointSave();
        }
        const pct = 15 + Math.round((completedReposCount / Math.max(1, totalReposToScan)) * 60);
        postProgress(
          "AUTOPSY",
          repo.fullName || "repository",
          completedReposCount,
          totalReposToScan,
          pct,
          `Examining specimen ${completedReposCount}/${totalReposToScan}: ${repo.name}...`,
          client.getRateLimitStatus().remaining
        );
      }
    }
  }

  const pool: Promise<void>[] = [];
  const workerCount = Math.max(1, Math.min(state.concurrency, remaining.length));

  // Periodic checkpointing: a refresh or crash mid-analysis previously lost
  // all progress (checkpoints were only written on rate-limit pauses). Save
  // every CHECKPOINT_INTERVAL completed repos, serialized to keep writes
  // ordered. Completion deletes the checkpoint, so no stale resume prompt
  // survives a successful run.
  const CHECKPOINT_INTERVAL = 10;
  let checkpointChain: Promise<void> = Promise.resolve();
  const queueCheckpointSave = () => {
    if (!state.resumeReason) {
      state.resumeReason = "Analysis was interrupted before completion. Repos processed so far are preserved.";
    }
    checkpointChain = checkpointChain.then(() => saveCheckpoint(state));
  };

  for (let i = 0; i < workerCount; i++) {
    pool.push(worker());
  }

  await Promise.all(pool);
  await checkpointChain;
}

async function aggregateAndComplete(
  state: AnalysisState,
  rest: ForensicGitHubRest,
  graphql: ForensicGitHubGraphQL
): Promise<void> {
  if (cancelled) {
    post({ type: "CANCELLED" });
    return;
  }

  postProgress("AGGREGATION", "Forensic Metrics", 9, 10, 80, "Synthesizing classifications, temporal distributions, and awards...");

  const { allCommits, processedRepos, allWeeks, languageMap, profile } = state;

  const totalCommits = allCommits.length;
  const totalLinesAdded = processedRepos.reduce((acc, r) => acc + r.additions, 0);
  const totalLinesDeleted = processedRepos.reduce((acc, r) => acc + r.deletions, 0);
  const totalPrsAuthored = processedRepos.reduce((acc, r) => acc + r.prsAuthored, 0);
  const totalPrsMerged = processedRepos.reduce((acc, r) => acc + r.prsMerged, 0);
  const totalIssuesAuthored = processedRepos.reduce((acc, r) => acc + r.issuesAuthored, 0);

  const reviewsOutcome = await rest.getReviewsCount(state.subjectLogin, state.sinceDate);
  if (!reviewsOutcome.ok) {
    postLog("warn", `Reviews count fetch failed: ${reviewsOutcome.error}. Defaulting to 0.`);
    state.diagnosticsWarnings.push(`Reviews count fetch failed: ${reviewsOutcome.error}`);
  }
  const reviewsCount = reviewsOutcome.data;
  if (reviewsOutcome.truncated) {
    state.diagnosticsWarnings.push("Reviews count truncated at 1000 (GitHub Search API cap).");
  }

  const temporal = calculateTemporalAnalytics(allCommits, allWeeks, state.timezone);
  const churn = calculateCodeChurnAnalytics(allCommits);
  if (totalLinesAdded > 0 || totalLinesDeleted > 0) {
    churn.totalAdditions = totalLinesAdded;
    churn.totalDeletions = totalLinesDeleted;
    churn.netLines = totalLinesAdded - totalLinesDeleted;
    churn.churnRatio =
      totalLinesAdded + totalLinesDeleted > 0
        ? Math.round((totalLinesDeleted / (totalLinesAdded + totalLinesDeleted)) * 100) / 100
        : 0;
  }
  const commitForensics = analyzeCommitForensics(allCommits, state.subjectLogin);
  if (totalLinesAdded > 0 || totalLinesDeleted > 0) {
    commitForensics.churnRatio = churn.churnRatio;
  }

  const NON_FUNCTIONAL_LANGUAGES = new Set([
    "HTML", "CSS", "SCSS", "Less", "Markdown", "JSON", "JSON5", "JSON with Comments",
    "YAML", "XML", "SVG", "Text", "Plain Text", "Dockerfile", "Shell", "Batchfile",
    "PowerShell", "Makefile", "CMake", "Ignore List"
  ]);

  const totalBytes = Array.from(languageMap.values()).reduce((acc, v) => acc + v.bytes, 0);
  const languageAnalysis = Array.from(languageMap.entries())
    .map(([name, data]) => ({
      name,
      bytes: data.bytes,
      percentage: totalBytes > 0 ? Math.round((data.bytes / totalBytes) * 100) : 0,
      repoCount: data.repoCount,
      isFunctional: !NON_FUNCTIONAL_LANGUAGES.has(name),
    }))
    .sort((a, b) => b.bytes - a.bytes);

  let totalContributions = totalCommits;
  try {
    // Contribution calendars are queried one 365-day window per year. Span the
    // full account age (capped at 10 years ≈ 3650 GraphQL points to stay
    // inside the 5000/hr budget) instead of a fixed 2-year slice that silently
    // undercounts long-standing accounts.
    let calendarYears = 1;
    if (state.profile?.createdAt) {
      const accountAgeMs = Date.now() - new Date(state.profile.createdAt).getTime();
      calendarYears = Math.min(10, Math.max(1, Math.ceil(accountAgeMs / (365 * 86400000))));
    }
    const calendar = state.subjectLogin
      ? await graphql.getUserContributions(state.subjectLogin, state.sinceDate, undefined, calendarYears)
      : await graphql.getViewerContributions(state.sinceDate, undefined, calendarYears);
    if (calendar) {
      state.graphqlContributionCalendarAvailable = true;
      totalContributions = calendar.totalContributions;
    }
  } catch {
    postLog("warn", "GraphQL contribution calendar fetch failed; using REST-derived totals.");
  }

  const mergeRatePercentage = totalPrsAuthored > 0 ? Math.round((totalPrsMerged / totalPrsAuthored) * 100) : null;
  const averageDailyCommits = temporal.totalActiveDays > 0 ? Math.round((totalCommits / temporal.totalActiveDays) * 10) / 10 : 0;
  const multiContributorRepoCount = processedRepos.filter((r) => r.prsAuthored > 0 || r.stars > 0 || r.forks > 0).length;
  const multiContributorRepoShare = processedRepos.length > 0 ? Math.round((multiContributorRepoCount / processedRepos.length) * 100) : 0;
  const functionalLanguageCount = languageAnalysis.filter((l) => l.isFunctional && l.percentage >= 5).length;

  const summary = {
    totalCommits,
    totalContributions,
    reposAnalyzed: processedRepos.length,
    reposSkipped: state.failedRepos.length,
    activeRepos: processedRepos.filter((r) => r.daysSinceLastPush <= 90).length,
    linesAdded: totalLinesAdded,
    linesDeleted: totalLinesDeleted,
    netLines: totalLinesAdded - totalLinesDeleted,
    prsAuthored: totalPrsAuthored,
    prsMerged: totalPrsMerged,
    mergeRatePercentage,
    issuesAuthored: totalIssuesAuthored,
    reviewsAuthored: reviewsCount,
    reviewsAuthoredTruncated: reviewsOutcome.truncated,
    starsReceived: processedRepos.reduce((acc, r) => acc + r.stars, 0),
    forksReceived: processedRepos.reduce((acc, r) => acc + r.forks, 0),
    longestStreakDays: temporal.longestStreakDays,
    activeStreakDays: temporal.activeStreakDays,
    totalActiveDays: temporal.totalActiveDays,
    longestInactiveGapDays: temporal.longestInactiveGapDays,
    peakDailyCommits: temporal.peakDailyCommits,
    averageDailyCommits,
    multiContributorRepoShare,
    functionalLanguageCount,
    busiestHour: temporal.busiestHour,
    busiestWeekday: temporal.busiestWeekday,
    busiestMonth: temporal.busiestMonth,
    nightCommitPercentage: temporal.nightCommitPercentage,
    weekendCommitPercentage: temporal.weekendCommitPercentage,
    timezone: temporal.timezone,
    timezoneAbbr: temporal.timezoneAbbr,
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
      longestInactiveGapDays: temporal.longestInactiveGapDays,
      peakDailyCommits: temporal.peakDailyCommits,
      timezone: temporal.timezone,
      timezoneAbbr: temporal.timezoneAbbr,
    },
    summary,
    churn: {
      churnRatio: churn.churnRatio,
      totalDeletions: totalLinesDeleted,
      totalAdditions: totalLinesAdded,
    },
    commitForensics: {
      medianCommitSize: commitForensics.medianCommitSize,
      averageMessageLength: commitForensics.averageMessageLength,
      shortMessageCount: commitForensics.shortMessageCount,
      longMessageCount: commitForensics.longMessageCount,
      conventionalCommitCount: commitForensics.conventionalCommitCount,
      detailedCommitsCount: commitForensics.detailedCommitsCount,
    },
    languages: languageAnalysis,
    commitCategories: commitForensics.messageCategories,
  });

  const awards = generateRepositoryAwards(processedRepos, totalCommits);

  const partialAnalysis: Partial<GitopsyAnalysis> = {
    subject: profile || undefined,
    summary,
    repositories: processedRepos,
    languages: languageAnalysis,
    commitForensics,
  };

  const courtCharges = generateCourtCharges(partialAnalysis, state.subjectLogin, allCommits);
  const findings = generateDeterministicFindings(partialAnalysis);
  const easterEggs = detectDeterministicEasterEggs(partialAnalysis, allCommits);

  const diagnostics: AnalysisDiagnostics = {
    failedRepos: state.failedRepos,
    truncatedRepos: state.truncatedRepos,
    rateLimitHitCount: state.rateLimitHitCount,
    schedulerMaxRetries: 3,
    graphqlContributionCalendarAvailable: state.graphqlContributionCalendarAvailable,
    warnings: state.diagnosticsWarnings,
  };

  const finalReport: GitopsyAnalysis = {
    id: state.checkpointId,
    generatedAt: new Date().toISOString(),
    isIncremental: Boolean(state.isIncremental && state.sinceDate),
    durationMs: Date.now() - state.startedAt,
    subjectLogin: state.subjectLogin,
    subject: profile!,
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
      longestInactiveGapDays: temporal.longestInactiveGapDays,
      peakDailyCommits: temporal.peakDailyCommits,
      timezone: temporal.timezone,
      timezoneAbbr: temporal.timezoneAbbr,
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
    diagnostics,
    timezone: temporal.timezone,
    timezoneAbbr: temporal.timezoneAbbr,
  };

  try {
    await gitopsyDb.checkpoints.delete(state.checkpointId);
  } catch {
    // best-effort cleanup
  }

  post({ type: "COMPLETE", payload: { report: finalReport } });
}

async function runAnalysisPipeline(
  state: AnalysisState,
  token: string,
  isResume: boolean
): Promise<void> {
  try {
    const client = new ForensicGitHubClient({
      token,
      maxConcurrency: state.concurrency,
      baseDelayMs: 200,
      maxPages: 50,
      longPauseThresholdSeconds: 300,
      onRateLimitWarning: (status, message, isTerminal) => {
        if (!isTerminal) state.rateLimitHitCount++;
        post({
          type: "RATE_LIMIT",
          payload: {
            resetAt: status.resetTimeIso,
            waitSeconds: Math.max(1, status.resetTimeEpoch - Math.floor(Date.now() / 1000)),
            message,
            isTerminal,
          },
        });
      },
      onLongPause: (resetEpoch, resetIso, pauseSeconds) => {
        state.checkpointTriggered = true;
        state.rateLimitResetEpoch = resetEpoch;
        state.resumeAtIso = resetIso;
        state.resumeReason = `GitHub rate limit reached. ${pauseSeconds}s until reset at ${resetIso}.`;
        postLog("warn", state.resumeReason);
      },
    });

    const rest = new ForensicGitHubRest(client);
    const graphql = new ForensicGitHubGraphQL(client);

    if (cancelled) {
      post({ type: "CANCELLED" });
      return;
    }

    if (!isResume) {
      postProgress("IDENTIFICATION", "GitHub Profile", 1, 10, 5, "Summoning subject profile and metadata...");
      const profile = await rest.getAuthenticatedUser();
      state.profile = profile;
      state.subjectLogin = state.subjectLogin || profile.login;

      if (cancelled) {
        post({ type: "CANCELLED" });
        return;
      }

      postProgress("DISCOVERY", "Repositories", 2, 10, 15, `Discovering accessible repositories for @${state.subjectLogin}...`);
      const reposOutcome = await rest.getRepositories(state.sinceDate);
      if (!reposOutcome.ok) {
        postLog("error", `Repository discovery failed: ${reposOutcome.error}`);
        post({ type: "ERROR", payload: { error: `Repository discovery failed: ${reposOutcome.error}` } });
        return;
      }

      const rawRepos = reposOutcome.data;
      const owned = rawRepos.filter((r) =>
        r.fullName.toLowerCase().startsWith(state.subjectLogin.toLowerCase() + "/")
      );
      const ownedPublic = owned.filter((r) => !r.isPrivate).length;
      const ownedPrivate = owned.filter((r) => r.isPrivate).length;

      if (state.profile) {
        state.profile = {
          ...state.profile,
          accessibleReposCount: rawRepos.length,
          ownedReposCount: owned.length,
          ownedPublicRepos: ownedPublic,
          ownedPrivateRepos: ownedPrivate,
        };
      }

      if (reposOutcome.truncated) {
        state.diagnosticsWarnings.push(
          `Repository list was truncated at ${rawRepos.length} repos (max pages reached).`
        );
        post({
          type: "WARNING",
          payload: {
            message: `Repository list truncated at ${rawRepos.length} repos.`,
            code: "REPO_TRUNCATION",
          },
        });
      }

      // Scan all discovered repositories, including archived repositories.
      state.reposToScan = rawRepos;
    }

    const totalReposToScan = state.reposToScan.length;
    if (totalReposToScan === 0) {
      postLog("warn", "No repositories found for analysis.");
    }

    const alreadyProcessed = state.processedRepoFullNames.size;
    if (isResume && alreadyProcessed > 0) {
      postProgress(
        "RESUMING",
        "Checkpoint Restore",
        alreadyProcessed,
        totalReposToScan,
        15 + Math.round((alreadyProcessed / Math.max(1, totalReposToScan)) * 60),
        `Resuming from checkpoint: ${alreadyProcessed}/${totalReposToScan} repos already processed.`
      );
    }

    await processRepos(state, rest, client);

    if (state.fatalError && !cancelled) {
      post({ type: "ERROR", payload: { error: state.fatalError } });
      return;
    }

    if (state.checkpointTriggered && !cancelled) {
      await saveCheckpoint(state);
      post({
        type: "RESUME_AVAILABLE",
        payload: {
          checkpointId: state.checkpointId,
          resumeAt: state.resumeAtIso,
          resumeReason: state.resumeReason,
          resetEpoch: state.rateLimitResetEpoch,
        },
      });
      return;
    }

    if (cancelled) {
      post({ type: "CANCELLED" });
      return;
    }

    await aggregateAndComplete(state, rest, graphql);
  } catch (err) {
    const errorDetails = err instanceof Error ? err.stack || err.message : String(err);
    postLog("error", `Fatal analysis error: ${errorDetails}`);
    post({ type: "ERROR", payload: { error: String(err), details: errorDetails } });
  }
}

self.onmessage = async (event: MessageEvent<WorkerInMessage>) => {
  const data = event.data;

  if (data.type === "CANCEL") {
    cancelled = true;
    post({ type: "CANCELLED" });
    return;
  }

  if (data.type === "START_ANALYSIS") {
    cancelled = false;
    const { token, username, sinceDate, isIncremental, maxConcurrency, timezone } = data.payload;
    // A fresh analysis supersedes any prior checkpoint (rate-limit or
    // interrupted-run); without this, stale checkpoints accumulate and the
    // console offers to resume runs the user has already abandoned.
    try {
      await gitopsyDb.checkpoints.clear();
    } catch {
      // best-effort; resume-from-checkpoint just won't be offered
    }
    const concurrency = Math.max(1, Math.min(maxConcurrency ?? 15, 15));
    const checkpointId = `dossier-${username || "viewer"}-${Date.now()}`;
    const state = newState(checkpointId, username || "", concurrency);
    state.sinceDate = sinceDate;
    state.isIncremental = Boolean(isIncremental && sinceDate);
    state.timezone = timezone;
    await runAnalysisPipeline(state, token, false);
    return;
  }

  if (data.type === "RESUME") {
    cancelled = false;
    const { token, checkpoint, maxConcurrency, timezone } = data.payload;
    const state = restoreFromCheckpoint(checkpoint);
    state.concurrency = Math.max(1, Math.min(maxConcurrency ?? state.concurrency, 15));
    state.checkpointTriggered = false;
    if (timezone) state.timezone = timezone;
    postLog("info", `Resuming analysis from checkpoint ${checkpoint.checkpointId}. ${state.processedRepoFullNames.size}/${state.reposToScan.length} repos already processed.`);
    await runAnalysisPipeline(state, token, true);
    return;
  }
};
