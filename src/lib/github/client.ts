import { ForensicRequestScheduler, SchedulerOptions } from "./scheduler";
import { ForensicAuthError, ForensicGitHubError } from "./errors";

export interface GitHubClientOptions extends SchedulerOptions {
  token?: string;
  userAgent?: string;
  maxPages?: number;
}

export const DEFAULT_MAX_PAGES = 50;

export class ForensicGitHubClient {
  private token?: string;
  private scheduler: ForensicRequestScheduler;
  private userAgent: string;
  private baseUrl: string = "https://api.github.com";
  private maxPages: number;

  constructor(options: GitHubClientOptions = {}) {
    this.token = options.token;
    this.userAgent = options.userAgent || "Gitopsy-Forensic-Analyzer/1.0";
    this.maxPages = options.maxPages ?? DEFAULT_MAX_PAGES;
    this.scheduler = new ForensicRequestScheduler({
      maxConcurrency: options.maxConcurrency ?? 4,
      maxRetries: options.maxRetries ?? 3,
      baseDelayMs: options.baseDelayMs ?? 600,
      onRateLimitWarning: options.onRateLimitWarning,
    });
  }

  public setToken(token: string): void {
    this.token = token;
  }

  public clearToken(): void {
    this.token = undefined;
    this.scheduler.clearQueue();
  }

  public getRateLimitStatus() {
    return this.scheduler.getRateLimitStatus();
  }

  public getMaxPages(): number {
    return this.maxPages;
  }

  public async fetchRest<T = unknown>(
    path: string,
    params?: Record<string, string | number | boolean | undefined>,
    init?: RequestInit
  ): Promise<T> {
    const url = new URL(path.startsWith("http") ? path : `${this.baseUrl}${path}`);
    if (params) {
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null) {
          url.searchParams.set(key, String(val));
        }
      });
    }

    const headers: Record<string, string> = {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": this.userAgent,
      ...(init?.headers as Record<string, string>),
    };

    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }

    const cacheKey = `REST:${url.toString()}`;

    return this.scheduler.schedule(async () => {
      const response = await fetch(url.toString(), {
        ...init,
        headers,
      });

      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((val, key) => {
        responseHeaders[key.toLowerCase()] = val;
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new ForensicAuthError();
        }

        const errorBody = await response.text();
        let message = `GitHub API HTTP ${response.status}: ${response.statusText}`;
        try {
          const parsed = JSON.parse(errorBody);
          if (parsed.message) {
            message = parsed.message;
          }
        } catch {
          // ignore non-json error
        }

        throw {
          status: response.status,
          message,
          headers: responseHeaders,
        };
      }

      return (await response.json()) as T;
    }, cacheKey);
  }

  public async *paginateRest<T = unknown>(
    path: string,
    params?: Record<string, string | number | boolean | undefined>,
    maxPages?: number
  ): AsyncGenerator<T[], { totalFetched: number; hitMaxPages: boolean }, unknown> {
    let page = 1;
    const perPage = 100;
    const pagesCap = maxPages ?? this.maxPages;
    let totalFetched = 0;
    let hitMaxPages = false;

    while (page <= pagesCap) {
      const pageParams = {
        ...(params || {}),
        per_page: perPage,
        page,
      };

      const items = await this.fetchRest<T[]>(path, pageParams);
      if (!Array.isArray(items) || items.length === 0) {
        return { totalFetched, hitMaxPages };
      }

      totalFetched += items.length;
      yield items;

      if (items.length < perPage) {
        return { totalFetched, hitMaxPages };
      }
      page++;
      if (page > pagesCap) {
        hitMaxPages = true;
      }
    }

    return { totalFetched, hitMaxPages };
  }

  public async fetchGraphQL<T = unknown>(
    query: string,
    variables?: Record<string, unknown>
  ): Promise<T> {
    if (!this.token) {
      throw new ForensicAuthError("GitHub token required for GraphQL queries.");
    }

    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.token}`,
      "Content-Type": "application/json",
      "User-Agent": this.userAgent,
    };

    const cacheKey = `GQL:${query.slice(0, 40)}:${JSON.stringify(variables)}`;

    return this.scheduler.schedule(async () => {
      const response = await fetch("https://api.github.com/graphql", {
        method: "POST",
        headers,
        body: JSON.stringify({ query, variables }),
      });

      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((val, key) => {
        responseHeaders[key.toLowerCase()] = val;
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new ForensicAuthError();
        }
        throw new ForensicGitHubError(`GraphQL HTTP error ${response.status}`, {
          statusCode: response.status,
        });
      }

      const payload = (await response.json()) as { data?: T; errors?: { message: string }[] };
      if (payload.errors && payload.errors.length > 0) {
        throw new ForensicGitHubError(payload.errors[0].message);
      }

      if (!payload.data) {
        throw new ForensicGitHubError("GraphQL response returned null data.");
      }

      return payload.data;
    }, cacheKey);
  }
}
