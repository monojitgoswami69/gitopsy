#!/usr/bin/env python3
"""Generate a private-repository-aware GitHub profile activity report.

The token is read from GITHUB_TOKEN (or GH_TOKEN) and is never printed.
"""
from __future__ import annotations

import argparse
import json
import os
import sys
import time
from collections import Counter
from datetime import datetime, timezone
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen


API = "https://api.github.com"


class GitHub:
    def __init__(self, token: str, quiet: bool = False):
        self.token = token
        self.quiet = quiet

    def get(self, path: str, params: dict[str, Any] | None = None) -> Any:
        url = API + path
        if params:
            url += "?" + urlencode({k: v for k, v in params.items() if v is not None})
        req = Request(url, headers={
            "Authorization": f"Bearer {self.token}",
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
            "User-Agent": "github-profile-stats/1.0",
        })
        try:
            with urlopen(req, timeout=45) as response:
                return json.load(response)
        except HTTPError as exc:
            detail = exc.read().decode("utf-8", "replace")
            try:
                message = json.loads(detail).get("message", detail)
            except json.JSONDecodeError:
                message = detail
            raise RuntimeError(f"GitHub API {exc.code} for {path}: {message}") from exc
        except URLError as exc:
            raise RuntimeError(f"Could not reach GitHub: {exc.reason}") from exc

    def pages(self, path: str, params: dict[str, Any] | None = None):
        page = 1
        while True:
            values = self.get(path, {**(params or {}), "per_page": 100, "page": page})
            if not values:
                return
            yield from values
            if len(values) < 100:
                return
            page += 1


def iso_date(value: str | None) -> str | None:
    if not value:
        return None
    datetime.strptime(value, "%Y-%m-%d")
    return value


def collect(gh: GitHub, since: str | None, include_details: bool) -> dict[str, Any]:
    user = gh.get("/user")
    login = user["login"]
    repos = list(gh.pages("/user/repos", {"affiliation": "owner,collaborator,organization_member", "sort": "full_name"}))
    repos = [r for r in repos if not r.get("archived")]
    owned = [r for r in repos if r.get("owner", {}).get("login") == login]

    totals = Counter()
    languages = Counter()
    repo_rows: list[dict[str, Any]] = []
    seen_commit_ids: set[str] = set()
    pr_authored = pr_merged = issues_authored = reviews = 0

    for index, repo in enumerate(repos, 1):
        name = repo["full_name"]
        if not gh.quiet:
            print(f"Scanning {index}/{len(repos)}: {name}", file=sys.stderr)
        row = {
            "name": name,
            "private": repo.get("private", False),
            "stars": repo.get("stargazers_count", 0),
            "forks": repo.get("forks_count", 0),
            "commits": 0,
            "additions": 0,
            "deletions": 0,
            "pull_requests_authored": 0,
            "issues_authored": 0,
        }
        for lang, amount in gh.get(f"/repos/{name}/languages").items():
            languages[lang] += amount
        commits = gh.pages(f"/repos/{name}/commits", {"author": login, "since": since})
        for commit in commits:
            sha = commit["sha"]
            if sha in seen_commit_ids:
                continue
            seen_commit_ids.add(sha)
            row["commits"] += 1
            totals["commits"] += 1
            if include_details:
                detail = gh.get(f"/repos/{name}/commits/{sha}")
                stats = detail.get("stats", {})
                row["additions"] += stats.get("additions", 0)
                row["deletions"] += stats.get("deletions", 0)
                totals["additions"] += stats.get("additions", 0)
                totals["deletions"] += stats.get("deletions", 0)
                totals["files_changed"] += len(detail.get("files", []))

        prs = list(gh.pages(f"/repos/{name}/pulls", {"state": "all", "sort": "created", "direction": "asc"}))
        for pr in prs:
            created = pr.get("created_at", "")[:10]
            if pr.get("user", {}).get("login") == login and (not since or created >= since):
                row["pull_requests_authored"] += 1
                pr_authored += 1
                if pr.get("merged_at"):
                    pr_merged += 1
        issues = gh.pages(f"/repos/{name}/issues", {"state": "all", "creator": login})
        for issue in issues:
            if "pull_request" not in issue and (not since or issue.get("created_at", "")[:10] >= since):
                row["issues_authored"] += 1
                issues_authored += 1
        repo_rows.append(row)

    # Review search is less expensive than fetching every PR's review list.
    query = f"reviewed-by:{login}" + (f" created:>={since}" if since else "")
    try:
        reviews = gh.get("/search/issues", {"q": query})["total_count"]
    except RuntimeError:
        reviews = 0

    return {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "scope": {"user": login, "since": since, "repositories_scanned": len(repos)},
        "profile": {k: user.get(k) for k in ("login", "name", "company", "location", "bio", "public_repos", "followers", "following", "created_at")},
        "summary": {
            "repositories_accessible": len(repos), "repositories_owned": len(owned),
            "private_repositories_accessible": sum(r.get("private", False) for r in repos),
            "commits": totals["commits"], "lines_added": totals["additions"],
            "lines_deleted": totals["deletions"], "net_lines": totals["additions"] - totals["deletions"],
            "files_changed": totals["files_changed"], "pull_requests_authored": pr_authored,
            "pull_requests_merged": pr_merged, "issues_authored": issues_authored, "reviews_authored": reviews,
            "stars_received": sum(r.get("stargazers_count", 0) for r in repos),
            "forks_received": sum(r.get("forks_count", 0) for r in repos),
        },
        "languages_by_bytes": languages.most_common(),
        "repositories": sorted(repo_rows, key=lambda x: (-x["commits"], x["name"])),
        "notes": [
            "Lines added/deleted are summed from commit stats; they are not current codebase LOC.",
            "Only repositories accessible to the supplied token are included.",
            "Merge commits and commits duplicated across accessible repositories are counted once.",
        ],
    }


def fmt(n: int) -> str:
    return f"{n:,}"


def report(data: dict[str, Any]) -> str:
    p, s, scope = data["profile"], data["summary"], data["scope"]
    lines = ["=" * 76, f"GITHUB PROFILE REPORT — @{p['login']}", "=" * 76,
             f"Generated: {data['generated_at']}", f"Scope: {scope['repositories_scanned']} accessible repositories" + (f" since {scope['since']}" if scope["since"] else ""), "",
             "PROFILE", "-" * 76]
    for label, value in (("Name", p.get("name") or "—"), ("Company", p.get("company") or "—"), ("Location", p.get("location") or "—"), ("Followers", fmt(p.get("followers") or 0)), ("Following", fmt(p.get("following") or 0))):
        lines.append(f"{label:<28} {value}")
    lines += ["", "ACTIVITY SUMMARY", "-" * 76]
    metrics = [("Accessible repositories", s["repositories_accessible"]), ("Owned repositories", s["repositories_owned"]), ("Private repositories", s["private_repositories_accessible"]), ("Commits", s["commits"]), ("Lines added", s["lines_added"]), ("Lines deleted", s["lines_deleted"]), ("Net lines", s["net_lines"]), ("Files changed", s["files_changed"]), ("Pull requests authored", s["pull_requests_authored"]), ("Pull requests merged", s["pull_requests_merged"]), ("Issues authored", s["issues_authored"]), ("Reviews authored", s["reviews_authored"]), ("Stars received", s["stars_received"]), ("Forks received", s["forks_received"])]
    lines.extend(f"{label:<28} {fmt(value)}" for label, value in metrics)
    lines += ["", "LANGUAGES (GitHub byte totals)", "-" * 76]
    lines.extend(f"{lang:<28} {fmt(amount)} bytes" for lang, amount in data["languages_by_bytes"][:20])
    lines += ["", "REPOSITORIES", "-" * 76, f"{'Repository':<42} {'Commits':>8} {'Added':>10} {'Deleted':>10} {'PRs':>6}"]
    lines.extend(f"{r['name'][:42]:<42} {fmt(r['commits']):>8} {fmt(r['additions']):>10} {fmt(r['deletions']):>10} {fmt(r['pull_requests_authored']):>6}" for r in data["repositories"])
    lines += ["", "NOTES", "-" * 76] + [f"• {note}" for note in data["notes"]]
    return "\n".join(lines)


def main() -> int:
    parser = argparse.ArgumentParser(description="Aggregate GitHub profile activity, including private repositories.")
    parser.add_argument("--since", type=iso_date, help="Only include activity from YYYY-MM-DD onward")
    parser.add_argument("--json", metavar="FILE", help="Write the full machine-readable report to FILE")
    parser.add_argument("--no-commit-details", action="store_true", help="Skip per-commit line/file stats (much faster)")
    parser.add_argument("--quiet", action="store_true", help="Suppress repository progress")
    args = parser.parse_args()
    token = os.environ.get("GITHUB_TOKEN") or os.environ.get("GH_TOKEN")
    if not token:
        print("Set GITHUB_TOKEN (or GH_TOKEN) to a GitHub PAT before running.", file=sys.stderr)
        return 2
    try:
        data = collect(GitHub(token, args.quiet), args.since, not args.no_commit_details)
    except (RuntimeError, KeyError) as exc:
        print(f"Error: {exc}", file=sys.stderr)
        return 1
    print(report(data))
    if args.json:
        with open(args.json, "w", encoding="utf-8") as handle:
            json.dump(data, handle, indent=2)
            handle.write("\n")
        print(f"\nFull JSON report written to {args.json}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
