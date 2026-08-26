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
      {/* 05. Repository Portfolio */}
      <div className="border-[4px] border-black bg-white rounded-[12px] p-6 shadow-[8px_8px_0_0_#000] flex flex-col gap-6 text-black">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b-[3px] border-black pb-4">
          <div>
            <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
              <FolderGit2 className="size-6 text-black" /> 05. REPOSITORY PORTFOLIO
            </h2>
            <p className="text-xs font-bold text-gray-600">
              Examined {repositories.length} accessible repositories across public and authorized private scopes.
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
                <th className="p-3">Repository</th>
                <th className="p-3">Commits</th>
                <th className="p-3">Add / Del Churn</th>
                <th className="p-3">Primary Language</th>
                <th className="p-3">PRs / Issues</th>
                <th className="p-3">Stars / Forks</th>
                <th className="p-3">Activity Lifespan</th>
                <th className="p-3">Details</th>
              </tr>
            </thead>
            <tbody>
              {sortedRepos.map((repo) => {
                const isExpanded = expandedRepoId === repo.id;
                return (
                  <React.Fragment key={repo.id}>
                    <tr
                      onClick={() => setExpandedRepoId(isExpanded ? null : repo.id)}
                      className={`border-b-[2px] border-black text-xs font-bold hover:bg-amber-50 cursor-pointer transition-colors ${
                        isExpanded ? "bg-amber-50" : ""
                      }`}
                    >
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-black">{repo.name}</span>
                          {repo.isPrivate && (
                            <Badge variant="neutral" className="text-[9px] py-0 px-1">
                              <Lock className="size-2.5 mr-0.5" /> PRIVATE
                            </Badge>
                          )}
                          {repo.isFork && (
                            <Badge variant="neutral" className="text-[9px] py-0 px-1">
                              FORK
                            </Badge>
                          )}
                          {repo.isArchived && (
                            <Badge variant="coral" className="text-[9px] py-0 px-1">
                              ARCHIVED
                            </Badge>
                          )}
                        </div>
                        <div className="text-[10px] text-gray-500 font-mono font-normal">
                          {repo.fullName}
                        </div>
                      </td>
                      <td className="p-3 font-mono font-black">{repo.commitCount.toLocaleString()}</td>
                      <td className="p-3 font-mono text-[11px]">
                        <span className="text-emerald-700 font-black">+{repo.additions.toLocaleString()}</span>{" "}
                        <span className="text-rose-700 font-black">-{repo.deletions.toLocaleString()}</span>
                      </td>
                      <td className="p-3">
                        {repo.primaryLanguage ? (
                          <Badge variant="main" className="text-[10px]">
                            {repo.primaryLanguage}
                          </Badge>
                        ) : (
                          <span className="text-gray-400 font-mono text-[11px]">—</span>
                        )}
                      </td>
                      <td className="p-3 font-mono text-[11px]">
                        <span className="text-blue-700 font-bold">{repo.prsAuthored} PRs</span>
                        {repo.prsMerged > 0 && <span className="text-emerald-700 font-bold"> ({repo.prsMerged} m)</span>} •{" "}
                        <span className="text-amber-700 font-bold">{repo.issuesAuthored} Iss</span>
                      </td>
                      <td className="p-3 font-mono text-[11px]">
                        <span className="font-bold">★ {repo.stars}</span> • <span>🍴 {repo.forks}</span>
                      </td>
                      <td className="p-3 text-[11px] font-mono">
                        <div>{repo.activitySpanDays} days span</div>
                        <div className="text-[10px] text-gray-500">
                          {repo.daysSinceLastPush === 0 ? "Pushed today" : `${repo.daysSinceLastPush}d ago`}
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="p-1 h-auto"
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedRepoId(isExpanded ? null : repo.id);
                          }}
                        >
                          {isExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                        </Button>
                      </td>
                    </tr>

                    {/* Expandable Deep Inspection Drawer */}
                    {isExpanded && (
                      <tr className="border-b-[3px] border-black bg-amber-50/80">
                        <td colSpan={8} className="p-4">
                          <div className="flex flex-col gap-3 bg-white p-4 border-[2px] border-black rounded-[6px] shadow-[2px_2px_0_0_#000]">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-black uppercase text-black">
                                SPECIMEN DOSSIER: {repo.fullName}
                              </span>
                              <a
                                href={`https://github.com/${repo.fullName}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs font-black text-blue-700 hover:underline flex items-center gap-1"
                              >
                                OPEN ON GITHUB <ExternalLink className="size-3" />
                              </a>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-bold">
                              <div>
                                <span className="text-gray-500 text-[10px] uppercase">CREATED:</span>
                                <div>{repo.createdAt.slice(0, 10)}</div>
                              </div>
                              <div>
                                <span className="text-gray-500 text-[10px] uppercase">LAST ACTIVITY:</span>
                                <div>{repo.lastPushedAt.slice(0, 10)}</div>
                              </div>
                              <div>
                                <span className="text-gray-500 text-[10px] uppercase">NET CODE BALANCE:</span>
                                <div className={repo.netLines >= 0 ? "text-emerald-700" : "text-rose-700"}>
                                  {repo.netLines >= 0 ? `+${repo.netLines.toLocaleString()}` : repo.netLines.toLocaleString()} lines
                                </div>
                              </div>
                              <div>
                                <span className="text-gray-500 text-[10px] uppercase">DEFAULT BRANCH:</span>
                                <div className="font-mono">{repo.defaultBranch}</div>
                              </div>
                            </div>

                            {repo.languages.length > 0 && (
                              <div className="border-t border-black/10 pt-2 flex flex-col gap-1.5">
                                <span className="text-[10px] font-black uppercase text-gray-500">
                                  LANGUAGE COMPOSITION:
                                </span>
                                <div className="flex flex-wrap gap-2">
                                  {repo.languages.map((l) => (
                                    <Badge key={l.name} variant="cyan" className="text-[10px]">
                                      {l.name}: {l.percentage > 0 ? `${l.percentage}%` : l.bytes > 0 ? "<1%" : "0%"} ({(l.bytes / 1024).toFixed(1)} KB)
                                    </Badge>
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

      {/* 06. Repository Distinctions */}
      {awards.length > 0 && (
        <div id="section-distinctions" className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Trophy className="size-6 text-[#FD9745]" />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-black uppercase tracking-tight text-black">
                  06. REPOSITORY DISTINCTIONS
                </h2>
                <Badge variant="coral">{awards.length}</Badge>
              </div>
              <p className="text-xs font-bold text-gray-600 mt-0.5">
                Evidence-based repository distinctions awarded based on verifiable commit, churn, and longevity milestones.
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
