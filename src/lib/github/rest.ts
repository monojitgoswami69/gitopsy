import { ForensicGitHubClient } from "./client";
import { isResumableRateLimitError, isAuthError } from "./errors";
import { SubjectProfile, ForensicCommit } from "@/types/domain";

export interface RestRepoSummary {
  id: number;
  name: string;
  fullName: string;
  isPrivate: boolean;
  isFork: boolean;
  isArchived: boolean;
  defaultBranch: string;
  stars: number;
  forks: number;
  openIssues: number;
  sizeKb: number;
  createdAt: string;
  updatedAt: string;
  lastPushedAt: string;
  primaryLanguage: string | null;
  topics: string[];
}

export interface RestPullRequest {
  id: number;
  number: number;
  repoFullName: string;
  title: string;
  authorLogin: string;
  createdAt: string;
  mergedAt: string | null;
  closedAt: string | null;
  state: "open" | "closed" | "merged";
  commentsCount: number;
}

export interface RestIssue {
  id: number;
  number: number;
  repoFullName: string;
  title: string;
  authorLogin: string;
  createdAt: string;
  closedAt: string | null;
  state: "open" | "closed";
  commentsCount: number;
}

export interface FetchOutcome<T> {
  data: T;
  ok: boolean;
  error?: string;
  truncated: boolean;
}

function ok<T>(data: T, truncated = false): FetchOutcome<T> {
  return { data, ok: true, truncated };
}

function fail<T>(defaultValue: T, error: string): FetchOutcome<T> {
  return { data: defaultValue, ok: false, error, truncated: false };
}

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function isValidIsoDate(dateStr: string | undefined): boolean {
  if (!dateStr) return true;
  const parsed = new Date(dateStr);
  return !isNaN(parsed.getTime()) && dateStr.includes("T");
}

export class ForensicGitHubRest {
  constructor(private client: ForensicGitHubClient) {}

  public async getAuthenticatedUser(): Promise<SubjectProfile> {
    interface GitHubUserResponse {
      login: string;
      name: string | null;
      avatar_url: string;
      bio: string | null;
      location: string | null;
      company: string | null;
      public_repos: number;
      total_private_repos?: number;
      owned_private_repos?: number;
      followers: number;
      following: number;
      created_at: string;
    }

    const user = await this.client.fetchRest<GitHubUserResponse>("/user");

    const publicRepos = user.public_repos ?? 0;
    const totalPrivateRepos = user.total_private_repos ?? 0;
    const ownedPrivateRepos = user.owned_private_repos ?? totalPrivateRepos;
    const ownedPublicRepos = publicRepos;
    const ownedReposCount = ownedPublicRepos + ownedPrivateRepos;
    const accessibleReposCount = publicRepos + totalPrivateRepos;

    return {
      login: user.login,
      name: user.name,
      avatarUrl: user.avatar_url,
      bio: user.bio,
      location: user.location,
      company: user.company,
      publicRepos,
      totalPrivateRepos,
      ownedReposCount,
      ownedPublicRepos,
      ownedPrivateRepos,
      accessibleReposCount,
      followers: user.followers,
      following: user.following,
      createdAt: user.created_at,
    };
  }

  public async getRepositories(sinceDate?: string): Promise<FetchOutcome<RestRepoSummary[]>> {
    if (!isValidIsoDate(sinceDate)) {
      return fail([], `Invalid sinceDate format: "${sinceDate}". Expected ISO 8601.`);
    }

    interface RawRepo {
      id: number;
      name: string;
      full_name: string;
      owner: { login: string };
      private: boolean;
      fork: boolean;
      archived: boolean;
      default_branch: string;
      stargazers_count: number;
      forks_count: number;
      open_issues_count: number;
      size: number;
      created_at: string;
      updated_at: string;
      pushed_at: string;
      language: string | null;
      topics?: string[];
    }

    try {
      const repos: RestRepoSummary[] = [];
      let hitMaxPages = false;

      // Manual iteration (not for-await) so the generator's return value —
      // which carries hitMaxPages — is not discarded.
      const generator = this.client.paginateRest<RawRepo>("/user/repos", {
        affiliation: "owner,collaborator,organization_member",
        sort: "pushed",
        direction: "desc",
      });

      let iterResult = await generator.next();
      while (!iterResult.done) {
        for (const r of iterResult.value) {
          if (sinceDate && r.pushed_at && r.pushed_at < sinceDate) {
            continue;
          }

          repos.push({
            id: r.id,
            name: r.name,
            fullName: r.full_name,
            isPrivate: r.private,
            isFork: r.fork,
            isArchived: r.archived,
            defaultBranch: r.default_branch || "main",
            stars: r.stargazers_count,
            forks: r.forks_count,
            openIssues: r.open_issues_count,
            sizeKb: r.size,
            createdAt: r.created_at,
            updatedAt: r.updated_at,
            lastPushedAt: r.pushed_at || r.updated_at,
            primaryLanguage: r.language,
            topics: r.topics || [],
          });
        }
        iterResult = await generator.next();
      }

      hitMaxPages = iterResult.value?.hitMaxPages === true;

      return ok(repos, hitMaxPages);
    } catch (err) {
      // A revoked/expired token must abort the whole analysis, not
      // silently downgrade every repo into a per-repo failure entry.
      if (isAuthError(err)) throw err;
      return fail([], err instanceof Error ? err.message : String(err));
    }
  }

  public async getRepoLanguages(
    fullName: string
  ): Promise<FetchOutcome<{ name: string; bytes: number; percentage: number }[]>> {
    try {
      const data = await this.client.fetchRest<Record<string, number>>(`/repos/${fullName}/languages`);
      // Empty repos legitimately answer 204/empty body — that is "no
      // languages", not an error.
      if (!data || typeof data !== "object") return ok([]);

      const totalBytes = Object.values(data).reduce((acc, bytes) => acc + bytes, 0);

      if (totalBytes === 0) return ok([]);

      const result = Object.entries(data)
        .map(([name, bytes]) => ({
          name,
          bytes,
          percentage: Math.round((bytes / totalBytes) * 100),
        }))
        .sort((a, b) => b.bytes - a.bytes);

      return ok(result);
    } catch (err) {
      // A revoked/expired token must abort the whole analysis, not
      // silently downgrade every repo into a per-repo failure entry.
      if (isAuthError(err)) throw err;
      return fail([], err instanceof Error ? err.message : String(err));
    }
  }

  /**
   * Fetches the user's commits for a repo. By default there is NO cap: every
   * page is fetched until exhausted. Pass maxCommits only where a bounded
   * sample is explicitly wanted.
   */
  public async getRepoCommits(
    fullName: string,
    author: string,
    sinceDate?: string,
    maxCommits?: number
  ): Promise<FetchOutcome<ForensicCommit[]>> {
    if (!isValidIsoDate(sinceDate)) {
      return fail([], `Invalid sinceDate format: "${sinceDate}". Expected ISO 8601.`);
    }

    interface RawCommit {
      sha: string;
      commit: {
        author: { name: string; email: string; date: string };
        message: string;
      };
      parents?: { sha: string }[];
    }

    try {
      const commits: ForensicCommit[] = [];
      let count = 0;
      let truncated = false;

      const commitGenerator = this.client.paginateRest<RawCommit>(`/repos/${fullName}/commits`, {
        author,
        since: sinceDate,
      });

      let iterResult = await commitGenerator.next();
      while (!iterResult.done) {
        for (const c of iterResult.value) {
          if (maxCommits !== undefined && count >= maxCommits) {
            truncated = true;
            break;
          }

          const date = new Date(c.commit.author.date);
          const hour = date.getUTCHours();
          const weekday = date.getUTCDay();
          const month = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
          const isMerge = Boolean(c.parents && c.parents.length > 1);
          const isRevert = c.commit.message.toLowerCase().startsWith("revert");

          commits.push({
            sha: c.sha,
            repoFullName: fullName,
            authorLogin: author,
            authorDate: c.commit.author.date,
            message: c.commit.message,
            additions: 0,
            deletions: 0,
            filesChanged: 0,
            isMerge,
            isRevert,
            hour,
            weekday,
            month,
            hasDetails: false,
          });
          count++;
        }
        if (maxCommits !== undefined && count >= maxCommits) {
          truncated = true;
          break;
        }
        iterResult = await commitGenerator.next();
      }

      // Generator exhausted due to its own page cap rather than running out
      // of data: mark truncated so the UI/diagnostics know history is short.
      if (!truncated && iterResult.done && iterResult.value?.hitMaxPages === true) {
        truncated = true;
      }

      return ok(commits, truncated);
    } catch (err) {
      // A revoked/expired token must abort the whole analysis, not
      // silently downgrade every repo into a per-repo failure entry.
      if (isAuthError(err)) throw err;
      return fail([], err instanceof Error ? err.message : String(err));
    }
  }

  public async getRepoContributorStats(
    fullName: string,
    author: string
  ): Promise<
    FetchOutcome<{
      additions: number;
      deletions: number;
      commits: number;
      weeks: { w: number; a: number; d: number; c: number }[];
    } | null>
  > {
    interface ContributorStats {
      author?: { login: string };
      total: number;
      weeks: { w: number; a: number; d: number; c: number }[];
    }

    // GitHub returns "202 Accepted" with an EMPTY body the first time(s)
    // this endpoint is hit while it computes statistics server-side. A single
    // attempt therefore silently loses all weekly churn data for the repo —
    // retry with backoff until a real payload (200) or a hard error arrives.
    const MAX_ATTEMPTS = 3;
    let lastErrorLabel = "";

    const httpStatusOf = (err: unknown): number | undefined => {
      const obj = err as { status?: number; statusCode?: number } | null;
      return obj?.status ?? obj?.statusCode;
    };

    try {
      for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        let stats: ContributorStats[] | undefined;
        try {
          stats = await this.client.fetchRest<ContributorStats[]>(
            `/repos/${fullName}/stats/contributors`
          );
        } catch (err) {
          // Rate-limit aborts drive the checkpoint/resume flow — rethrow so
          // the worker stops cleanly instead of firing more requests at an
          // exhausted limit. Auth errors must abort the analysis entirely.
          if (isResumableRateLimitError(err)) throw err;
          if (isAuthError(err)) throw err;

          const status = httpStatusOf(err);
          // Hard client errors (404 empty stats, 401, 403 permission, 422…)
          // will not heal by retrying: fail immediately.
          if (status !== undefined && status >= 400 && status < 500) {
            return fail(null, err instanceof Error ? err.message : String(err));
          }
          // Transient 5xx / unknown transport error: retry with backoff.
          if (attempt >= MAX_ATTEMPTS) {
            return fail(null, err instanceof Error ? err.message : String(err));
          }
          lastErrorLabel = err instanceof Error ? err.message : String(err);
          await delay(1500 * attempt);
          continue;
        }

        if (Array.isArray(stats)) {
          const userStats = stats.find(
            (s) => s.author?.login?.toLowerCase() === author.toLowerCase()
          );
          if (!userStats) return ok(null);

          const additions = userStats.weeks.reduce((acc, w) => acc + (w.a || 0), 0);
          const deletions = userStats.weeks.reduce((acc, w) => acc + (w.d || 0), 0);
          const commits = userStats.total || userStats.weeks.reduce((acc, w) => acc + (w.c || 0), 0);

          return ok({ additions, deletions, commits, weeks: userStats.weeks || [] });
        }

        // Non-array result means empty body (202 warm-up). Retry.
        if (attempt < MAX_ATTEMPTS) {
          await delay(1500 * attempt);
        }
      }

      return fail(
        null,
        `Contributor stats unavailable after ${MAX_ATTEMPTS} attempts${lastErrorLabel ? ` (${lastErrorLabel})` : ""}.`
      );
    } catch (err) {
      // isResumableRateLimitError re-throws land here and must keep flying.
      if (isResumableRateLimitError(err)) throw err;
      return fail(null, err instanceof Error ? err.message : String(err));
    }
  }

  public async getCommitDetails(
    fullName: string,
    sha: string
  ): Promise<FetchOutcome<{ additions: number; deletions: number; filesChanged: number }>> {
    interface CommitDetail {
      stats?: { additions: number; deletions: number; total: number };
      files?: unknown[];
    }

    try {
      const detail = await this.client.fetchRest<CommitDetail>(`/repos/${fullName}/commits/${sha}`);
      return ok({
        additions: detail.stats?.additions ?? 0,
        deletions: detail.stats?.deletions ?? 0,
        filesChanged: detail.files?.length ?? 0,
      });
    } catch (err) {
      // A revoked/expired token must abort the whole analysis, not
      // silently downgrade every repo into a per-repo failure entry.
      if (isAuthError(err)) throw err;
      return fail(
        { additions: 0, deletions: 0, filesChanged: 0 },
        err instanceof Error ? err.message : String(err)
      );
    }
  }

  public async getRepoPullRequests(
    fullName: string,
    author: string,
    sinceDate?: string
  ): Promise<FetchOutcome<RestPullRequest[]>> {
    if (!isValidIsoDate(sinceDate)) {
      return fail([], `Invalid sinceDate format: "${sinceDate}". Expected ISO 8601.`);
    }

    interface RawPR {
      id: number;
      number: number;
      title: string;
      user: { login: string };
      created_at: string;
      merged_at: string | null;
      closed_at: string | null;
      state: "open" | "closed";
      comments?: number;
    }

    try {
      const prs: RestPullRequest[] = [];
      let truncated = false;
      let stopPagination = false;

      // /pulls has no author filter, so every page costs requests for repos
      // with heavy non-author activity. Cap deep pagination at 10 pages
      // (1000 newest PRs) and record truncation instead of burning up to
      // 50 pages per repo and triggering secondary rate limits.
      const generator = this.client.paginateRest<RawPR>(
        `/repos/${fullName}/pulls`,
        {
          state: "all",
          sort: "created",
          direction: "desc",
        },
        10
      );

      let iterResult = await generator.next();
      while (!iterResult.done && !stopPagination) {
        for (const pr of iterResult.value) {
          // GitHub logins are case-insensitive; the login casing on a repo's
          // PR payload can differ from the authenticated login (renames), so
          // compare case-insensitively or authored PRs are silently dropped.
          if (pr.user?.login?.toLowerCase() !== author.toLowerCase()) continue;

          if (sinceDate && pr.created_at < sinceDate) {
            stopPagination = true;
            break;
          }

          prs.push({
            id: pr.id,
            number: pr.number,
            repoFullName: fullName,
            title: pr.title,
            authorLogin: author,
            createdAt: pr.created_at,
            mergedAt: pr.merged_at,
            closedAt: pr.closed_at,
            state: pr.merged_at ? "merged" : pr.state,
            commentsCount: pr.comments ?? 0,
          });
        }
        if (!stopPagination) {
          iterResult = await generator.next();
        }
      }

      // Truncated only when the generator exhausted its page cap (history
      // deeper than 1000 PRs); an early stop at sinceDate is intentional
      // completion, not truncation.
      truncated = iterResult.done === true && iterResult.value?.hitMaxPages === true;

      return ok(prs, truncated);
    } catch (err) {
      // A revoked/expired token must abort the whole analysis, not
      // silently downgrade every repo into a per-repo failure entry.
      if (isAuthError(err)) throw err;
      return fail([], err instanceof Error ? err.message : String(err));
    }
  }

  public async getRepoIssues(
    fullName: string,
    author: string,
    sinceDate?: string
  ): Promise<FetchOutcome<RestIssue[]>> {
    if (!isValidIsoDate(sinceDate)) {
      return fail([], `Invalid sinceDate format: "${sinceDate}". Expected ISO 8601.`);
    }

    interface RawIssue {
      id: number;
      number: number;
      title: string;
      user: { login: string };
      created_at: string;
      closed_at: string | null;
      state: "open" | "closed";
      pull_request?: unknown;
      comments?: number;
    }

    try {
      const issues: RestIssue[] = [];

      for await (const page of this.client.paginateRest<RawIssue>(`/repos/${fullName}/issues`, {
        creator: author,
        state: "all",
        sort: "created",
        direction: "desc",
        since: sinceDate,
      })) {
        for (const issue of page) {
          if (issue.pull_request) continue;
          // Case-insensitive for the same reason as the PR filter above.
          if (issue.user?.login?.toLowerCase() !== author.toLowerCase()) continue;
          if (sinceDate && issue.created_at < sinceDate) continue;

          issues.push({
            id: issue.id,
            number: issue.number,
            repoFullName: fullName,
            title: issue.title,
            authorLogin: author,
            createdAt: issue.created_at,
            closedAt: issue.closed_at,
            state: issue.state,
            commentsCount: issue.comments ?? 0,
          });
        }
      }

      return ok(issues, false);
    } catch (err) {
      // A revoked/expired token must abort the whole analysis, not
      // silently downgrade every repo into a per-repo failure entry.
      if (isAuthError(err)) throw err;
      return fail([], err instanceof Error ? err.message : String(err));
    }
  }

  public async getReviewsCount(login: string, sinceDate?: string): Promise<FetchOutcome<number>> {
    const query = `reviewed-by:${login}` + (sinceDate ? ` created:>=${sinceDate.slice(0, 10)}` : "");
    try {
      const res = await this.client.fetchRest<{ total_count: number }>("/search/issues", { q: query });
      const count = res?.total_count || 0;
      const truncated = count >= 1000;
      return ok(count, truncated);
    } catch (err) {
      // A revoked/expired token must abort the whole analysis, not
      // silently downgrade every repo into a per-repo failure entry.
      if (isAuthError(err)) throw err;
      return fail(0, err instanceof Error ? err.message : String(err));
    }
  }
}
