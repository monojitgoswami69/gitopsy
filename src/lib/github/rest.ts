import { ForensicGitHubClient } from "./client";
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
      followers: number;
      following: number;
      created_at: string;
    }

    const user = await this.client.fetchRest<GitHubUserResponse>("/user");

    return {
      login: user.login,
      name: user.name,
      avatarUrl: user.avatar_url,
      bio: user.bio,
      location: user.location,
      company: user.company,
      publicRepos: user.public_repos,
      totalPrivateRepos: user.total_private_repos ?? 0,
      followers: user.followers,
      following: user.following,
      createdAt: user.created_at,
    };
  }

  public async getRepositories(sinceDate?: string): Promise<RestRepoSummary[]> {
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

    const repos: RestRepoSummary[] = [];

    for await (const page of this.client.paginateRest<RawRepo>("/user/repos", {
      affiliation: "owner,collaborator,organization_member",
      sort: "pushed",
      direction: "desc",
    })) {
      for (const r of page) {
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
    }

    return repos;
  }

  public async getRepoLanguages(fullName: string): Promise<{ name: string; bytes: number; percentage: number }[]> {
    try {
      const data = await this.client.fetchRest<Record<string, number>>(`/repos/${fullName}/languages`);
      const totalBytes = Object.values(data).reduce((acc, bytes) => acc + bytes, 0);

      if (totalBytes === 0) return [];

      return Object.entries(data)
        .map(([name, bytes]) => ({
          name,
          bytes,
          percentage: Math.round((bytes / totalBytes) * 100),
        }))
        .sort((a, b) => b.bytes - a.bytes);
    } catch {
      return [];
    }
  }

  public async getRepoCommits(
    fullName: string,
    author: string,
    sinceDate?: string,
    maxCommits: number = 100
  ): Promise<ForensicCommit[]> {
    interface RawCommit {
      sha: string;
      commit: {
        author: { name: string; email: string; date: string };
        message: string;
      };
      parents?: { sha: string }[];
    }

    const commits: ForensicCommit[] = [];
    let count = 0;

    for await (const page of this.client.paginateRest<RawCommit>(`/repos/${fullName}/commits`, {
      author,
      since: sinceDate,
    })) {
      for (const c of page) {
        if (count >= maxCommits) break;

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
        });
        count++;
      }
      if (count >= maxCommits) break;
    }

    return commits;
  }

  public async getRepoContributorStats(
    fullName: string,
    author: string
  ): Promise<{ additions: number; deletions: number; commits: number } | null> {
    interface ContributorStats {
      author?: { login: string };
      total: number;
      weeks: { w: number; a: number; d: number; c: number }[];
    }

    try {
      const stats = await this.client.fetchRest<ContributorStats[]>(`/repos/${fullName}/stats/contributors`);
      if (!Array.isArray(stats)) return null;

      const userStats = stats.find(
        (s) => s.author?.login?.toLowerCase() === author.toLowerCase()
      );
      if (!userStats) return null;

      const additions = userStats.weeks.reduce((acc, w) => acc + (w.a || 0), 0);
      const deletions = userStats.weeks.reduce((acc, w) => acc + (w.d || 0), 0);
      const commits = userStats.total || userStats.weeks.reduce((acc, w) => acc + (w.c || 0), 0);

      return { additions, deletions, commits };
    } catch {
      return null;
    }
  }

  public async getCommitDetails(
    fullName: string,
    sha: string
  ): Promise<{ additions: number; deletions: number; filesChanged: number }> {
    interface CommitDetail {
      stats?: { additions: number; deletions: number; total: number };
      files?: unknown[];
    }

    try {
      const detail = await this.client.fetchRest<CommitDetail>(`/repos/${fullName}/commits/${sha}`);
      return {
        additions: detail.stats?.additions ?? 0,
        deletions: detail.stats?.deletions ?? 0,
        filesChanged: detail.files?.length ?? 0,
      };
    } catch {
      return { additions: 0, deletions: 0, filesChanged: 0 };
    }
  }

  public async getRepoPullRequests(
    fullName: string,
    author: string,
    sinceDate?: string
  ): Promise<RestPullRequest[]> {
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

    const prs: RestPullRequest[] = [];

    for await (const page of this.client.paginateRest<RawPR>(`/repos/${fullName}/pulls`, {
      state: "all",
      sort: "created",
      direction: "desc",
    })) {
      for (const pr of page) {
        if (pr.user?.login === author) {
          if (sinceDate && pr.created_at < sinceDate) continue;

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
      }
    }

    return prs;
  }

  public async getRepoIssues(fullName: string, author: string, sinceDate?: string): Promise<RestIssue[]> {
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

    const issues: RestIssue[] = [];

    for await (const page of this.client.paginateRest<RawIssue>(`/repos/${fullName}/issues`, {
      creator: author,
      state: "all",
      sort: "created",
      direction: "desc",
    })) {
      for (const issue of page) {
        if (!issue.pull_request && issue.user?.login === author) {
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
    }

    return issues;
  }

  public async getReviewsCount(login: string, sinceDate?: string): Promise<number> {
    const query = `reviewed-by:${login}` + (sinceDate ? ` created:>=${sinceDate}` : "");
    try {
      const res = await this.client.fetchRest<{ total_count: number }>("/search/issues", { q: query });
      return res.total_count || 0;
    } catch {
      return 0;
    }
  }
}
