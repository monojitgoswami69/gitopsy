import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ForensicGitHubClient } from "@/lib/github/client";
import { ForensicGitHubRest } from "@/lib/github/rest";
import { isAuthError } from "@/lib/github/errors";

/**
 * Real client against a stubbed global fetch, so pagination termination,
 * truncation flags, author filtering and auth-error propagation are all
 * exercised through the actual production code paths.
 */

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function pagedBody(total: number, perPage: number, page: number) {
  const start = (page - 1) * perPage;
  return Array.from({ length: Math.max(0, Math.min(perPage, total - start)) }, (_, i) => ({
    id: start + i,
  }));
}

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("getRepoPullRequests", () => {
  it("matches the author case-insensitively (login casing differs)", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse([
        {
          id: 1,
          number: 1,
          title: "pr one",
          user: { login: "MonoUser" },
          created_at: "2026-01-02T00:00:00Z",
          merged_at: null,
          closed_at: null,
          state: "open",
          comments: 0,
        },
        {
          id: 2,
          number: 2,
          title: "someone else's pr",
          user: { login: "otherdev" },
          created_at: "2026-01-03T00:00:00Z",
          merged_at: null,
          closed_at: null,
          state: "open",
          comments: 0,
        },
      ])
    );

    const client = new ForensicGitHubClient({ token: "t" });
    const rest = new ForensicGitHubRest(client);
    const outcome = await rest.getRepoPullRequests("a/b", "monouser", "2026-01-01T00:00:00Z");

    expect(outcome.ok).toBe(true);
    expect(outcome.data).toHaveLength(1);
    expect(outcome.data[0].id).toBe(1);
  });

  it("reports truncation when the 10-page cap is hit", async () => {
    fetchMock.mockImplementation(async (_url: string, init?: RequestInit) => {
      const url = new URL(_url as string);
      const page = Number(url.searchParams.get("page") || "1");
      // Always a full page of 100 foreign-authored PRs -> never early-stops.
      return jsonResponse(
        Array.from({ length: 100 }, (_, i) => ({
          id: page * 1000 + i,
          number: i,
          title: "x",
          user: { login: "monouser" },
          created_at: "2026-05-01T00:00:00Z",
          merged_at: null,
          closed_at: null,
          state: "open",
          comments: 0,
        }))
      );
    });

    const client = new ForensicGitHubClient({ token: "t" });
    const rest = new ForensicGitHubRest(client);
    const outcome = await rest.getRepoPullRequests("a/b", "monouser", undefined);

    expect(outcome.ok).toBe(true);
    expect(outcome.truncated).toBe(true);
    expect(outcome.data.length).toBe(1000);
  });
});

describe("getRepoIssues", () => {
  it("skips pull requests and matches author case-insensitively", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse([
        {
          id: 1,
          number: 1,
          title: "real issue",
          user: { login: "MonoUser" },
          created_at: "2026-01-02T00:00:00Z",
          closed_at: null,
          state: "open",
          comments: 0,
        },
        {
          id: 2,
          number: 2,
          title: "actually a PR",
          user: { login: "monouser" },
          created_at: "2026-01-02T00:00:00Z",
          closed_at: null,
          state: "open",
          comments: 0,
          pull_request: { url: "https://api.github.com/repos/a/b/pulls/2" },
        },
      ])
    );

    const client = new ForensicGitHubClient({ token: "t" });
    const rest = new ForensicGitHubRest(client);
    const outcome = await rest.getRepoIssues("a/b", "monouser", "2026-01-01T00:00:00Z");

    expect(outcome.ok).toBe(true);
    expect(outcome.data).toHaveLength(1);
    expect(outcome.data[0].id).toBe(1);
  });
});

describe("getRepoCommits pagination", () => {
  it("terminates on a partial page and collects everything", async () => {
    fetchMock.mockImplementation(async (_url: string) => {
      const url = new URL(_url as string);
      const page = Number(url.searchParams.get("page") || "1");
      const count = page === 1 ? 100 : 30;
      return jsonResponse(
        Array.from({ length: count }, (_, i) => ({
          sha: `sha${page}-${i}`,
          commit: {
            author: { name: "n", email: "e@x.com", date: "2026-03-01T12:00:00Z" },
            message: `commit ${page}-${i}`,
          },
          parents: [{ sha: "p" }],
        }))
      );
    });

    const client = new ForensicGitHubClient({ token: "t" });
    const rest = new ForensicGitHubRest(client);
    const outcome = await rest.getRepoCommits("a/b", "monouser");

    expect(outcome.ok).toBe(true);
    expect(outcome.data).toHaveLength(130);
    expect(outcome.truncated).toBe(false);
  });

  it("flags truncation when the client page cap cuts history short", async () => {
    fetchMock.mockImplementation(async (_url: string) => {
      const url = new URL(_url as string);
      const page = Number(url.searchParams.get("page") || "1");
      // Always full pages: the cap must be what stops pagination.
      return jsonResponse(
        Array.from({ length: 100 }, (_, i) => ({
          sha: `sha${page}-${i}`,
          commit: {
            author: { name: "n", email: "e@x.com", date: "2026-03-01T12:00:00Z" },
            message: "m",
          },
          parents: [{ sha: "p" }],
        }))
      );
    });

    const client = new ForensicGitHubClient({ token: "t", maxPages: 2 });
    const rest = new ForensicGitHubRest(client);
    const outcome = await rest.getRepoCommits("a/b", "monouser");

    expect(outcome.ok).toBe(true);
    expect(outcome.data).toHaveLength(200);
    expect(outcome.truncated).toBe(true);
  });
});

describe("getRepositories", () => {
  it("filters by sinceDate on pushed_at and propagates truncation", async () => {
    fetchMock.mockImplementation(async (_url: string) => {
      const url = new URL(_url as string);
      const page = Number(url.searchParams.get("page") || "1");
      const items = pagedBody(100, 100, page).map((x) => ({
        ...x,
        name: `repo${x.id}`,
        full_name: `owner/repo${x.id}`,
        owner: { login: "owner" },
        private: false,
        fork: false,
        archived: false,
        default_branch: "main",
        stargazers_count: 0,
        forks_count: 0,
        open_issues_count: 0,
        size: 1,
        created_at: "2026-01-01T00:00:00Z",
        updated_at: "2026-01-01T00:00:00Z",
        // Everything pushed before the cutoff must be skipped.
        pushed_at: x.id < 50 ? "2020-01-01T00:00:00Z" : "2026-06-01T00:00:00Z",
        language: null,
        topics: [],
      }));
      return jsonResponse(items);
    });

    const client = new ForensicGitHubClient({ token: "t", maxPages: 1 });
    const rest = new ForensicGitHubRest(client);
    const outcome = await rest.getRepositories("2026-01-01T00:00:00Z");

    expect(outcome.ok).toBe(true);
    expect(outcome.truncated).toBe(true);
    expect(outcome.data).toHaveLength(50);
    expect(outcome.data.every((r) => r.lastPushedAt >= "2026-01-01T00:00:00Z")).toBe(true);
  });
});

describe("auth error propagation", () => {
  it("re-throws 401 responses instead of recording a per-repo failure", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ message: "Bad credentials" }), {
        status: 401,
        headers: { "content-type": "application/json" },
      })
    );

    const client = new ForensicGitHubClient({ token: "expired" });
    const rest = new ForensicGitHubRest(client);

    await expect(rest.getRepoCommits("a/b", "monouser")).rejects.toSatisfy(isAuthError);
    await expect(rest.getRepoPullRequests("a/b", "monouser")).rejects.toSatisfy(isAuthError);
    await expect(rest.getRepoLanguages("a/b")).rejects.toSatisfy(isAuthError);
  });

  it("isAuthError distinguishes 401 from other statuses", () => {
    expect(isAuthError({ status: 401, message: "nope" })).toBe(true);
    expect(isAuthError({ statusCode: 401 })).toBe(true);
    expect(isAuthError({ status: 403, message: "forbidden" })).toBe(false);
    expect(isAuthError(new Error("plain"))).toBe(false);
  });
});
