"use client";

import React, { useState } from "react";
import Link from "next/link";
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
  GitCommit,
  ArrowRight,
} from "lucide-react";

interface RepositorySectionProps {
  repositories: RepositoryAnalysis[];
  awards: RepositoryAward[];
}

type SortField = "commits" | "recent" | "churn" | "stars";

const LANGUAGE_COLORS = [
  "#FF6B6B",
  "#4D96FF",
  "#6BCB77",
  "#FFDC58",
  "#C084FC",
  "#FD9745",
  "#2DD4BF",
  "#F43F5E",
];

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

  const activeRepos = repositories.filter((r) => r.commitCount > 0);

  const sortedRepos = [...activeRepos].sort((a, b) => {
    let diff = 0;
    switch (sortField) {
      case "commits":
        diff = b.commitCount - a.commitCount;
        break;
      case "recent":
        diff = a.daysSinceLastPush - b.daysSinceLastPush; // fewer days = more recent
        break;
      case "churn":
        diff = b.additions + b.deletions - (a.additions + a.deletions);
        break;
      case "stars":
        diff = b.stars - a.stars;
        break;
    }
    return sortAsc ? -diff : diff;
  });

  return (
    <div id="section-repositories" className="flex flex-col gap-8">
      {/* 04. Repository Portfolio */}
      <div className="border-[4px] border-black bg-white rounded-[12px] p-5 sm:p-6 shadow-[3.5px_3.5px_0_0_#000] flex flex-col gap-5 text-black">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b-[2px] border-black/15 pb-4">
          <div>
            <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
              <FolderGit2 className="size-6 text-black" /> 04. REPOSITORY PORTFOLIO
            </h2>
            <p className="text-xs font-bold text-gray-600 mt-0.5">
              Displaying {repositories.length} contributed repositories with verified commit activity.
            </p>
          </div>

          {/* Minimal Lightweight Sort Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            <span className="text-xs font-black uppercase text-gray-500 mr-1">SORT:</span>
            <Button
              size="sm"
              variant={sortField === "commits" ? "main" : "outline"}
              onClick={() => handleSort("commits")}
            >
              COMMITS <ArrowUpDown className="size-3" />
            </Button>
            <Button
              size="sm"
              variant={sortField === "recent" ? "main" : "outline"}
              onClick={() => handleSort("recent")}
            >
              ACTIVITY <ArrowUpDown className="size-3" />
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
          </div>
        </div>

        {/* Scannable Minimal Repository Index List */}
        <div className="flex flex-col -mx-5 sm:-mx-6">
          {/* List Column Header */}
          <div className="hidden sm:flex items-center justify-between px-5 sm:px-6 py-2 bg-neutral-100/75 border-y-[1.5px] border-black/15 text-[10px] font-black uppercase tracking-wider text-gray-500 select-none">
            <span>REPOSITORY</span>
            <div className="flex items-center gap-6 shrink-0">
              <span className="min-w-[85px] text-right">COMMITS</span>
              <span className="min-w-[140px]">ACTIVITY / RECENCY</span>
              <span className="w-6 text-center">DETAILS</span>
            </div>
          </div>

          <div className="flex flex-col divide-y divide-black/10">
            {sortedRepos.map((repo) => {
              const isExpanded = expandedRepoId === repo.id;
              const repoAwards = awards.filter(
                (a) => a.repoFullName.toLowerCase() === repo.fullName.toLowerCase()
              );
              const isDormant = repo.daysSinceLastPush > 180;
              const isRecent = repo.daysSinceLastPush <= 30;

              return (
                <div key={repo.id} className="flex flex-col">
                  {/* Default Clean Scannable Row */}
                  <div
                    onClick={() => setExpandedRepoId(isExpanded ? null : repo.id)}
                    className={`px-5 sm:px-6 py-3.5 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4 hover:bg-amber-50/50 cursor-pointer transition-colors select-none ${
                      isExpanded ? "bg-amber-50/40" : ""
                    }`}
                  >
                  {/* Left Column: Repo Name, Badges, Full Identifier */}
                  <div className="flex flex-col min-w-0 pr-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-black text-sm sm:text-[15px] text-black tracking-tight hover:underline">
                        {repo.name}
                      </span>
                      {repo.isPrivate && (
                        <Badge variant="neutral" className="text-[9px] py-0 px-1 font-mono">
                          <Lock className="size-2.5 mr-0.5" /> PRIVATE
                        </Badge>
                      )}
                      {repo.isFork && (
                        <Badge variant="neutral" className="text-[9px] py-0 px-1 font-mono">
                          FORK
                        </Badge>
                      )}
                      {repo.isArchived && (
                        <Badge variant="coral" className="text-[9px] py-0 px-1 font-mono">
                          ARCHIVED
                        </Badge>
                      )}
                      {repoAwards.length > 0 && (
                        <span className="text-[10px] font-black bg-[#FFDC58] text-black border border-black px-1.5 py-0.2 rounded shadow-[1px_1px_0_0_#000]">
                          {repoAwards[0].badge} {repoAwards[0].title}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-mono text-gray-500 truncate max-w-xs sm:max-w-md mt-0.5">
                      {repo.fullName}
                    </span>
                  </div>

                  {/* Right Column: Desktop Scannable Metrics */}
                  <div className="hidden sm:flex items-center gap-6 shrink-0">
                    <span className="font-mono font-black text-xs text-black min-w-[85px] text-right">
                      {repo.commitCount.toLocaleString()} commits
                    </span>

                    <div className="min-w-[140px] flex items-center gap-1.5 text-[11px] font-mono font-bold text-gray-600">
                      <span
                        className={`size-2 rounded-full border border-black shrink-0 ${
                          isRecent
                            ? "bg-emerald-500"
                            : isDormant
                            ? "bg-gray-300"
                            : "bg-amber-400"
                        }`}
                      />
                      <span>
                        {isDormant
                          ? `Dormant · ${repo.daysSinceLastPush}d ago`
                          : repo.daysSinceLastPush === 0
                          ? "Active · Pushed today"
                          : `Active · ${repo.daysSinceLastPush}d ago`}
                      </span>
                    </div>

                    <div className="size-6 rounded flex items-center justify-center border border-black/20 hover:border-black hover:bg-[#FFDC58] transition-all text-black">
                      {isExpanded ? (
                        <ChevronUp className="size-4 stroke-[2.5]" />
                      ) : (
                        <ChevronDown className="size-4 stroke-[2.5]" />
                      )}
                    </div>
                  </div>

                  {/* Mobile Row Summary */}
                  <div className="flex sm:hidden items-center justify-between text-xs font-mono font-bold pt-1 border-t border-black/5 text-gray-700">
                    <span className="font-black text-black">{repo.commitCount} commits</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-gray-500">
                        {repo.daysSinceLastPush === 0 ? "Today" : `${repo.daysSinceLastPush}d ago`}
                      </span>
                      <ChevronDown
                        className={`size-4 stroke-[2.5] transition-transform ${
                          isExpanded ? "rotate-180" : ""
                        }`}
                      />
                    </div>
                  </div>
                </div>

                {/* Expanded Detailed Repository Dossier */}
                {isExpanded && (
                  <div className="bg-[#FFFDF7] border-y-[2px] border-black/15 px-5 sm:px-6 py-5 sm:py-6 flex flex-col gap-5 text-black animate-in fade-in duration-150">
                    {/* Header & Quick Action Buttons */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-black/10 pb-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-black uppercase tracking-wider text-gray-500">
                            SPECIMEN DOSSIER
                          </span>
                          <span className="font-mono text-[10px] font-bold bg-neutral-100 px-2 py-0.5 rounded border border-black/20">
                            branch: {repo.defaultBranch}
                          </span>
                          {repo.primaryLanguage && (
                            <span className="text-[10px] font-black uppercase px-2 py-0.5 border border-black rounded bg-[#FFDC58] text-black font-mono shadow-[1px_1px_0_0_#000]">
                              Primary: {repo.primaryLanguage}
                            </span>
                          )}
                        </div>
                        <h3 className="font-mono font-black text-base sm:text-lg text-black mt-0.5">
                          {repo.fullName}
                        </h3>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <a
                          href={`https://github.com/${repo.fullName}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-black bg-[#FFDC58] hover:bg-[#ffe27a] text-black px-3 py-1.5 border-[1.5px] border-black rounded shadow-[1.5px_1.5px_0_0_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
                        >
                          OPEN ON GITHUB <ExternalLink className="size-3.5" />
                        </a>
                        <Link
                          href={`/repositories/${repo.fullName}`}
                          className="inline-flex items-center gap-1.5 text-xs font-black bg-white hover:bg-neutral-100 text-black px-3 py-1.5 border-[1.5px] border-black rounded shadow-[1.5px_1.5px_0_0_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
                        >
                          FULL AUTOPSY <ArrowRight className="size-3.5" />
                        </Link>
                      </div>
                    </div>

                    {/* Deterministic Repository Awards (if applicable) */}
                    {repoAwards.length > 0 && (
                      <div className="flex flex-col gap-2">
                        <span className="text-[10px] font-black uppercase tracking-wider text-gray-600">
                          VERIFIED REPOSITORY DISTINCTIONS ({repoAwards.length})
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {repoAwards.map((award) => (
                            <div
                              key={award.id}
                              className="border-[2px] border-black bg-amber-50/90 rounded-[8px] p-3.5 shadow-[2px_2px_0_0_#000] flex flex-col justify-between gap-2"
                            >
                              <div>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-1.5 font-black text-xs uppercase text-black">
                                    <span className="text-base">{award.badge}</span>
                                    <span>{award.title}</span>
                                  </div>
                                  <Badge
                                    variant={
                                      award.category === "CHAOS"
                                        ? "coral"
                                        : award.category === "VELOCITY"
                                        ? "cyan"
                                        : "main"
                                    }
                                    className="text-[9px] py-0 px-1 font-mono"
                                  >
                                    {award.category}
                                  </Badge>
                                </div>
                                <p className="text-xs font-semibold text-gray-700 leading-relaxed mt-1">
                                  {award.description}
                                </p>
                              </div>
                              <div className="border-t border-black/10 pt-2 flex items-start gap-1.5 text-[11px] font-bold text-emerald-800">
                                <CheckCircle2 className="size-3.5 text-emerald-700 shrink-0 mt-0.5" />
                                <span>Evidence: {award.evidence}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Core Engineering Activity Metrics Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div className="border-[1.5px] border-black p-3 rounded-[6px] bg-white shadow-[1.5px_1.5px_0_0_#000]">
                        <span className="text-[10px] font-black uppercase text-gray-500 block">
                          COMMITS ANALYZED
                        </span>
                        <div className="text-lg font-black font-mono mt-0.5 text-black">
                          {repo.commitCount.toLocaleString()}
                        </div>
                        <span className="text-[10px] font-mono text-gray-500">
                          {repo.activitySpanDays} days span
                        </span>
                      </div>

                      <div className="border-[1.5px] border-black p-3 rounded-[6px] bg-white shadow-[1.5px_1.5px_0_0_#000]">
                        <span className="text-[10px] font-black uppercase text-gray-500 block">
                          NET CODE BALANCE
                        </span>
                        <div
                          className={`text-lg font-black font-mono mt-0.5 ${
                            repo.netLines >= 0 ? "text-emerald-700" : "text-rose-700"
                          }`}
                        >
                          {repo.netLines >= 0 ? `+${repo.netLines.toLocaleString()}` : repo.netLines.toLocaleString()}
                        </div>
                        <span className="text-[10px] font-mono text-gray-500">
                          +{repo.additions.toLocaleString()} / -{repo.deletions.toLocaleString()}
                        </span>
                      </div>

                      <div className="border-[1.5px] border-black p-3 rounded-[6px] bg-white shadow-[1.5px_1.5px_0_0_#000]">
                        <span className="text-[10px] font-black uppercase text-gray-500 block">
                          PULL REQUESTS & ISSUES
                        </span>
                        <div className="text-lg font-black font-mono mt-0.5 text-blue-700">
                          {repo.prsAuthored} PRs
                        </div>
                        <span className="text-[10px] font-mono text-gray-500">
                          {repo.prsMerged} merged · {repo.issuesAuthored} issues
                        </span>
                      </div>

                      <div className="border-[1.5px] border-black p-3 rounded-[6px] bg-white shadow-[1.5px_1.5px_0_0_#000]">
                        <span className="text-[10px] font-black uppercase text-gray-500 block">
                          COMMUNITY & TRACTION
                        </span>
                        <div className="text-lg font-black font-mono mt-0.5 text-black">
                          ★ {repo.stars} <span className="text-xs font-normal text-gray-500 font-mono">stars</span>
                        </div>
                        <span className="text-[10px] font-mono text-gray-500">
                          🍴 {repo.forks} forks · {repo.openIssues} open issues
                        </span>
                      </div>
                    </div>

                    {/* Language Composition Breakdown */}
                    {repo.languages.length > 0 && (
                      <div className="border-[1.5px] border-black p-3.5 rounded-[8px] bg-white shadow-[1.5px_1.5px_0_0_#000] flex flex-col gap-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase tracking-wider text-gray-600">
                            LANGUAGE COMPOSITION ({repo.languages.length})
                          </span>
                          <span className="text-[10px] font-mono font-bold text-gray-500">
                            {(
                              repo.languages.reduce((acc, l) => acc + l.bytes, 0) / 1024
                            ).toFixed(1)}{" "}
                            KB total
                          </span>
                        </div>

                        {/* Multi-segment proportional bar */}
                        <div className="h-3 w-full rounded border border-black overflow-hidden flex bg-gray-100">
                          {repo.languages.map((l, idx) => (
                            <div
                              key={l.name}
                              style={{
                                width: `${Math.max(1, l.percentage)}%`,
                                backgroundColor:
                                  LANGUAGE_COLORS[idx % LANGUAGE_COLORS.length],
                              }}
                              title={`${l.name}: ${l.percentage}%`}
                              className="h-full border-r border-black/20 last:border-r-0"
                            />
                          ))}
                        </div>

                        {/* Language Chips */}
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {repo.languages.map((l, idx) => (
                            <div
                              key={l.name}
                              className="inline-flex items-center gap-1 text-[10px] font-mono font-bold bg-neutral-50 px-2 py-0.5 border border-black/20 rounded"
                            >
                              <span
                                className="size-2 rounded-full border border-black/40"
                                style={{
                                  backgroundColor:
                                    LANGUAGE_COLORS[idx % LANGUAGE_COLORS.length],
                                }}
                              />
                              <span className="font-black text-black">{l.name}</span>
                              <span className="text-gray-500">
                                {l.percentage > 0 ? `${l.percentage}%` : "<1%"}
                              </span>
                              <span className="text-gray-400">
                                ({(l.bytes / 1024).toFixed(1)} KB)
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Timeline & Traceability Links */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1 border-t border-black/10 text-[11px] font-mono text-gray-600 font-bold">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span>Created: {repo.createdAt.slice(0, 10)}</span>
                        <span>•</span>
                        <span>Last Push: {repo.lastPushedAt.slice(0, 10)}</span>
                      </div>

                      <div className="flex items-center gap-3">
                        <a
                          href={`https://github.com/${repo.fullName}/commits`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-black hover:underline flex items-center gap-1"
                        >
                          <GitCommit className="size-3" /> Commits Log ↗
                        </a>
                        <a
                          href={`https://github.com/${repo.fullName}/pulls`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-black hover:underline flex items-center gap-1"
                        >
                          <GitPullRequest className="size-3" /> PRs ↗
                        </a>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          </div>
        </div>
      </div>

      {/* 05. Repository Distinctions Overview */}
      {awards.length > 0 && (
        <div id="section-distinctions" className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Trophy className="size-6 text-[#FD9745]" />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-black uppercase tracking-tight text-black">
                  05. REPOSITORY DISTINCTIONS
                </h2>
                <Badge variant="coral">{awards.length}</Badge>
              </div>
              <p className="text-xs font-bold text-gray-600 mt-0.5">
                Evidence-based repository distinctions awarded based on verifiable commit, churn, and longevity milestones.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {awards.map((award) => {
              const categoryBadgeVariant: "coral" | "cyan" | "main" | "purple" | "lime" =
                award.category === "CHAOS"
                  ? "coral"
                  : award.category === "VELOCITY"
                  ? "cyan"
                  : award.category === "SCALE"
                  ? "purple"
                  : award.category === "CRAFT"
                  ? "lime"
                  : "main";

              return (
                <div
                  key={award.id}
                  className="border-[3px] border-black bg-white rounded-[12px] p-5 shadow-[3.5px_3.5px_0_0_#000] flex flex-col justify-between gap-4 text-black hover:translate-x-[1.5px] hover:translate-y-[1.5px] hover:shadow-[2px_2px_0_0_#000] active:translate-x-[3.5px] active:translate-y-[3.5px] active:shadow-none transition-all duration-150"
                >
                  <div className="flex flex-col gap-3">
                    {/* Header: Emblem box + Title + Category Badge */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="size-11 rounded-[8px] border-[2px] border-black bg-neutral-100 shadow-[2px_2px_0_0_#000] flex items-center justify-center text-2xl select-none shrink-0">
                          {award.badge}
                        </div>
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-wider text-gray-500 block">
                            DISTINCTION
                          </span>
                          <h3 className="text-sm sm:text-base font-black uppercase tracking-tight text-black leading-tight">
                            {award.title}
                          </h3>
                        </div>
                      </div>
                      <Badge variant={categoryBadgeVariant}>
                        {award.category}
                      </Badge>
                    </div>

                    {/* Interactive Clickable Repository Link */}
                    <a
                      href={`https://github.com/${award.repoFullName}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-fit max-w-full px-2.5 py-1 bg-neutral-100 hover:bg-[#FFDC58] text-black border-[1.5px] border-black rounded-[6px] shadow-[1.5px_1.5px_0_0_#000] hover:translate-x-[0.5px] hover:translate-y-[0.5px] hover:shadow-[1px_1px_0_0_#000] active:translate-x-[1.5px] active:translate-y-[1.5px] active:shadow-none text-xs font-mono font-bold flex items-center gap-1.5 transition-all truncate group/repo"
                      title={`Open ${award.repoFullName} on GitHub`}
                    >
                      <FolderGit2 className="size-3 text-gray-700 group-hover/repo:text-black shrink-0" />
                      <span className="truncate">{award.repoFullName}</span>
                      <ExternalLink className="size-2.5 text-gray-400 group-hover/repo:text-black shrink-0 ml-0.5" />
                    </a>

                    {/* Description */}
                    <p className="text-xs font-semibold text-gray-700 leading-relaxed">
                      {award.description}
                    </p>
                  </div>

                  {/* Verified Evidence Drawer */}
                  <div className="bg-[#FFFDF5] border-[2px] border-black rounded-[8px] p-3 shadow-[2px_2px_0_0_#000] flex flex-col gap-1 mt-auto">
                    <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-gray-700">
                      <CheckCircle2 className="size-3 text-emerald-700 shrink-0" />
                      <span>VERIFIED EVIDENCE</span>
                    </div>
                    <p className="text-xs font-mono font-bold text-black leading-snug">
                      {award.evidence}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
