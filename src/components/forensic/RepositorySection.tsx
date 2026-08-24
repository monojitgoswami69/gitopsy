"use client";

import React, { useState } from "react";
import { RepositoryAnalysis, RepositoryAward } from "@/types/domain";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FolderGit2,
  Trophy,
  ArrowUpDown,
  Star,
  GitFork,
  GitPullRequest,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Lock,
  ExternalLink,
} from "lucide-react";

interface RepositorySectionProps {
  repositories: RepositoryAnalysis[];
  awards: RepositoryAward[];
}

type SortField = "commits" | "churn" | "stars" | "recent" | "age";

export function RepositorySection({ repositories, awards }: RepositorySectionProps) {
  const [sortField, setSortField] = useState<SortField>("commits");
  const [sortAsc, setSortAsc] = useState(false);
  const [expandedRepoId, setExpandedRepoId] = useState<number | null>(null);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const sortedRepos = [...repositories].sort((a, b) => {
    let diff = 0;
    switch (sortField) {
      case "commits":
        diff = b.commitCount - a.commitCount;
        break;
      case "churn":
        diff = b.additions + b.deletions - (a.additions + a.deletions);
        break;
      case "stars":
        diff = b.stars - a.stars;
        break;
      case "recent":
        diff = a.daysSinceLastPush - b.daysSinceLastPush; // lower days = more recent
        break;
      case "age":
        diff = b.activitySpanDays - a.activitySpanDays;
        break;
    }
    return sortAsc ? -diff : diff;
  });

  return (
    <div id="section-repositories" className="flex flex-col gap-8">
      {/* 05. Repository Roster Table */}
      <div className="border-[4px] border-black bg-white rounded-[12px] p-6 shadow-[8px_8px_0_0_#000] flex flex-col gap-6 text-black">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b-[3px] border-black pb-4">
          <div>
            <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
              <FolderGit2 className="size-6 text-black" /> 04. REPOSITORY ROSTER & DEEP AUTOPSY
            </h2>
            <p className="text-xs font-bold text-gray-600">
              Examined {repositories.length} accessible specimens across public and authorized private scopes.
            </p>
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-black uppercase text-gray-500">SORT BY:</span>
            <Button
              size="sm"
              variant={sortField === "commits" ? "main" : "outline"}
              onClick={() => handleSort("commits")}
            >
              COMMITS <ArrowUpDown className="size-3" />
            </Button>
            <Button
              size="sm"
              variant={sortField === "churn" ? "main" : "outline"}
              onClick={() => handleSort("churn")}
            >
              CHURN <ArrowUpDown className="size-3" />
            </Button>
            <Button
              size="sm"
              variant={sortField === "stars" ? "main" : "outline"}
              onClick={() => handleSort("stars")}
            >
              STARS <ArrowUpDown className="size-3" />
            </Button>
            <Button
              size="sm"
              variant={sortField === "recent" ? "main" : "outline"}
              onClick={() => handleSort("recent")}
            >
              RECENCY <ArrowUpDown className="size-3" />
            </Button>
          </div>
        </div>

        {/* Repository Table */}
        <div className="overflow-x-auto border-[3px] border-black rounded-[8px] shadow-[4px_4px_0_0_#000]">
          <table className="w-full text-left border-collapse bg-white">
            <thead>
              <tr className="border-b-[3px] border-black bg-[#FFDC58] text-xs font-black uppercase tracking-wider text-black">
                <th className="p-3">Specimen</th>
                <th className="p-3">Commits</th>
                <th className="p-3">Add / Del Churn</th>
                <th className="p-3">Primary Language</th>
                <th className="p-3">Stars / Forks</th>
                <th className="p-3">PRs / Issues</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y-[2px] divide-black/20 text-xs font-semibold">
              {sortedRepos.map((repo) => {
                const isExpanded = expandedRepoId === repo.id;
                const isDormant = repo.daysSinceLastPush > 180;
                return (
                  <React.Fragment key={repo.fullName}>
                    <tr
                      className={`hover:bg-amber-50/70 transition-all cursor-pointer ${
                        isExpanded ? "bg-amber-50" : ""
                      }`}
                      onClick={() => setExpandedRepoId(isExpanded ? null : repo.id)}
                    >
                      <td className="p-3 font-bold">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm text-black">{repo.name}</span>
                          {repo.isPrivate && <Badge variant="neutral"><Lock className="size-2.5" /> PRIV</Badge>}
                          {repo.isArchived && <Badge variant="dark">ARCHIVED</Badge>}
                        </div>
                        <div className="text-[10px] text-gray-500 font-mono truncate max-w-xs">
                          {repo.fullName}
                        </div>
                      </td>
                      <td className="p-3 font-mono font-black text-sm">{repo.commitCount}</td>
                      <td className="p-3 font-mono">
                        <span className="text-emerald-700 font-bold">+{repo.additions.toLocaleString()}</span> /{" "}
                        <span className="text-rose-700 font-bold">-{repo.deletions.toLocaleString()}</span>
                      </td>
                      <td className="p-3 font-bold uppercase">{repo.primaryLanguage || "—"}</td>
                      <td className="p-3 font-mono font-bold">
                        <span className="inline-flex items-center gap-2">
                          <span className="inline-flex items-center gap-1">
                            <Star className="size-3.5 text-amber-500 fill-amber-400 stroke-[2.5]" />
                            <span>{repo.stars}</span>
                          </span>
                          <span className="text-gray-400">•</span>
                          <span className="inline-flex items-center gap-1">
                            <GitFork className="size-3.5 text-black stroke-[2.5]" />
                            <span>{repo.forks}</span>
                          </span>
                        </span>
                      </td>
                      <td className="p-3 font-mono font-bold">
                        {repo.prsMerged}/{repo.prsAuthored} PRs • {repo.issuesAuthored} issues
                      </td>
                      <td className="p-3">
                        <Badge variant={isDormant ? "coral" : repo.daysSinceLastPush <= 30 ? "lime" : "main"}>
                          {isDormant ? `DORMANT (${repo.daysSinceLastPush}d)` : `ACTIVE (${repo.daysSinceLastPush}d ago)`}
                        </Badge>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedRepoId(isExpanded ? null : repo.id);
                          }}
                          className="p-1 rounded border border-black hover:bg-white transition-all shadow-[1px_1px_0_0_#000]"
                          aria-label="Toggle repository details"
                        >
                          {isExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                        </button>
                      </td>
                    </tr>

                    {/* Expandable Detail Drawer */}
                    {isExpanded && (
                      <tr className="bg-amber-50/80 border-b-[2px] border-black">
                        <td colSpan={8} className="p-5">
                          <div className="border-[2px] border-black bg-white rounded-[8px] p-4 shadow-[3px_3px_0_0_#000] flex flex-col gap-4">
                            <div className="flex items-center justify-between border-b-[2px] border-black/10 pb-2">
                              <h4 className="font-black uppercase text-sm font-mono flex items-center gap-2">
                                SPECIMEN DOSSIER: {repo.fullName}
                              </h4>
                              <a
                                href={`https://github.com/${repo.fullName}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-xs font-black bg-[#FFDC58] hover:bg-[#FD9745] px-2.5 py-1 border border-black rounded shadow-[1px_1px_0_0_#000] transition-all"
                              >
                                VIEW ON GITHUB <ExternalLink className="size-3" />
                              </a>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                              <div className="bg-gray-50 border border-black/20 p-2.5 rounded">
                                <span className="text-[10px] font-black uppercase text-gray-500">ACTIVITY SPAN</span>
                                <div className="font-mono font-bold text-sm mt-0.5">{repo.activitySpanDays} days</div>
                              </div>
                              <div className="bg-gray-50 border border-black/20 p-2.5 rounded">
                                <span className="text-[10px] font-black uppercase text-gray-500">NET CODE PRODUCED</span>
                                <div className="font-mono font-bold text-sm mt-0.5">
                                  {repo.netLines >= 0 ? "+" : ""}{repo.netLines.toLocaleString()} lines
                                </div>
                              </div>
                              <div className="bg-gray-50 border border-black/20 p-2.5 rounded">
                                <span className="text-[10px] font-black uppercase text-gray-500">DEFAULT BRANCH</span>
                                <div className="font-mono font-bold text-sm mt-0.5">{repo.defaultBranch}</div>
                              </div>
                              <div className="bg-gray-50 border border-black/20 p-2.5 rounded">
                                <span className="text-[10px] font-black uppercase text-gray-500">CREATED AT</span>
                                <div className="font-mono font-bold text-sm mt-0.5">
                                  {new Date(repo.createdAt).toLocaleDateString()}
                                </div>
                              </div>
                            </div>

                            {/* Languages detected */}
                            {repo.languages.length > 0 && (
                              <div className="flex flex-col gap-1.5">
                                <span className="text-[10px] font-black uppercase text-gray-600">
                                  REPORTED LANGUAGE BYTES:
                                </span>
                                <div className="flex flex-wrap items-center gap-2">
                                  {repo.languages.map((lang) => (
                                    <div
                                      key={lang.name}
                                      className="border border-black bg-amber-100 px-2 py-0.5 rounded text-[11px] font-mono font-bold"
                                    >
                                      {lang.name}: {lang.percentage}% ({(lang.bytes / 1024).toFixed(1)} KB)
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 06. Repository Awards & Honors */}
      {awards.length > 0 && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Trophy className="size-6 text-[#FD9745]" />
            <div>
              <h2 className="text-xl font-black uppercase tracking-tight text-black">
                06. REPOSITORY AWARDS & HONORS
              </h2>
              <p className="text-xs font-bold text-gray-600">
                Deterministic forensic medals awarded based on verifiable commit, churn, and longevity thresholds.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {awards.map((award) => (
              <div
                key={award.id}
                className="border-[3px] border-black bg-white rounded-[10px] p-5 shadow-[4px_4px_0_0_#000] flex flex-col justify-between gap-4 text-black hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all duration-150"
              >
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">{award.badge}</span>
                    <Badge variant={award.category === "CHAOS" ? "coral" : award.category === "VELOCITY" ? "cyan" : "main"}>
                      {award.category}
                    </Badge>
                  </div>

                  <h3 className="text-base font-black uppercase tracking-tight mt-1">{award.title}</h3>
                  <div className="text-xs font-mono font-bold bg-black text-[#FFDC58] px-2 py-0.5 rounded w-fit truncate max-w-full">
                    {award.repoFullName}
                  </div>
                  <p className="text-xs font-semibold text-gray-700 leading-relaxed mt-1">
                    {award.description}
                  </p>
                </div>

                <div className="border-t-[2px] border-black/15 pt-2.5 flex items-start gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50/80 p-2 rounded border border-emerald-700">
                  <CheckCircle2 className="size-3.5 shrink-0 mt-0.5 text-emerald-700" />
                  <span>{award.evidence}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
