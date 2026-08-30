"use client";

import React, { useState } from "react";
import { RepositoryAnalysis, RepositoryAward } from "@/types/domain";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FolderGit2,
  Trophy,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Star,
  GitFork,
  GitPullRequest,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Lock,
  ExternalLink,
  GitCommit,
  Search,
} from "lucide-react";

interface RepositorySectionProps {
  repositories: RepositoryAnalysis[];
  awards: RepositoryAward[];
}

type SortField = "commits" | "recent";

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

function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query.trim() || !text) return text;
  const trimmed = query.trim();
  const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.split(new RegExp(`(${escaped})`, "gi"));

  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === trimmed.toLowerCase() ? (
          <mark
            key={i}
            className="bg-[#FFDC58] text-black px-0.5 rounded-[2px]"
          >
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
}

export function RepositorySection({ repositories, awards }: RepositorySectionProps) {
  const [sortField, setSortField] = useState<SortField>("commits");
  const [sortAsc, setSortAsc] = useState(false);
  const [expandedRepoId, setExpandedRepoId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const activeRepos = repositories.filter((r) => r.commitCount > 0);

  const filteredRepos = activeRepos.filter((r) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      r.name.toLowerCase().includes(q) ||
      r.fullName.toLowerCase().includes(q) ||
      (r.primaryLanguage && r.primaryLanguage.toLowerCase().includes(q))
    );
  });

  const sortedRepos = [...filteredRepos].sort((a, b) => {
    let diff = 0;
    switch (sortField) {
      case "commits":
        diff = b.commitCount - a.commitCount;
        break;
      case "recent":
        diff = a.daysSinceLastPush - b.daysSinceLastPush; // fewer days = more recent
        break;
    }
    return sortAsc ? -diff : diff;
  });

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="size-3 opacity-60" />;
    }
    return sortAsc ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />;
  };

  return (
    <div id="section-repositories" className="flex flex-col gap-8">
      {/* 04. Repository Portfolio */}
      <div className="border-[4px] border-black bg-white rounded-[12px] p-5 sm:p-6 pb-2.5 sm:pb-3 shadow-[3.5px_3.5px_0_0_#000] flex flex-col gap-4 sm:gap-5 text-black">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 border-b-[2px] border-black/15 pb-4">
          <div>
            <div className="flex items-center gap-2.5">
              <FolderGit2 className="size-5 sm:size-6 text-black stroke-[2.2] shrink-0" />
              <h2 className="text-xl font-bold uppercase tracking-tight">
                THE REPOSITORY PORTFOLIO
              </h2>
            </div>
            <p className="text-xs font-bold text-neutral-800 mt-1">
              The projects that make up your GitHub footprint, from workhorses to abandoned side projects.
            </p>
          </div>

          {/* Minimal Search Line & Sort Controls */}
          <div className="flex items-center gap-3 sm:gap-4 flex-wrap w-full sm:w-auto justify-center sm:justify-end">
            {/* Unboxed Underline Search Line */}
            <div className="flex items-center gap-1.5 border-b-[2px] border-black/25 focus-within:border-black pb-0.5 w-full sm:w-44 focus-within:sm:w-52 transition-all">
              <Search className="size-3.5 text-gray-500 stroke-[2.5] shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search repos..."
                className="bg-transparent text-xs font-mono font-bold text-black placeholder:text-gray-400 focus:outline-none w-full"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="text-gray-400 hover:text-black text-xs font-mono font-bold px-0.5"
                >
                  ×
                </button>
              )}
            </div>

            {/* Sort Controls */}
            <div className="flex items-center justify-center sm:justify-start gap-1.5 sm:gap-2 w-full sm:w-auto">
              <span className="text-xs font-black uppercase text-gray-500 mr-1 shrink-0">SORT:</span>
              <Button
                size="sm"
                variant={sortField === "commits" ? "main" : "outline"}
                onClick={() => handleSort("commits")}
                className="flex-1 sm:flex-initial justify-center"
              >
                COMMITS {getSortIcon("commits")}
              </Button>
              <Button
                size="sm"
                variant={sortField === "recent" ? "main" : "outline"}
                onClick={() => handleSort("recent")}
                className="flex-1 sm:flex-initial justify-center"
              >
                ACTIVITY {getSortIcon("recent")}
              </Button>
            </div>
          </div>
        </div>

        {/* Scannable Minimal Repository Index List */}
        <div className="flex flex-col">
          {/* List Column Header (Desktop Grid) */}
          <div className="hidden sm:grid grid-cols-[minmax(0,1fr)_80px_90px_70px_48px] items-center gap-6 px-3 py-2 border-b-[2px] border-black/15 text-[10px] font-black uppercase tracking-wider text-gray-500 select-none">
            <span>REPOSITORY</span>
            <span className="text-right">VISIBILITY</span>
            <span className="text-right">COMMITS</span>
            <span className="text-right">ACTIVITY</span>
            <span className="text-right">DETAILS</span>
          </div>

          <div className="flex flex-col">
            {sortedRepos.length === 0 ? (
              <div className="py-8 text-center text-xs font-mono text-gray-500">
                No repositories found matching &ldquo;{searchQuery}&rdquo;.
              </div>
            ) : (
              sortedRepos.map((repo) => {
              const isExpanded = expandedRepoId === repo.id;
              const isDormant = repo.daysSinceLastPush > 180;
              const isRecent = repo.daysSinceLastPush <= 30;

              return (
                <div
                  key={repo.id}
                  className={`transition-all duration-150 ${
                    isExpanded
                      ? "bg-[#FFFDF7] border-[2px] border-black rounded-[10px] my-2.5 p-4 sm:p-5"
                      : "hover:bg-amber-50/40 px-3 border-b border-black/25 last:border-b-0"
                  }`}
                >
                  {/* Summary Row (Clickable Header) */}
                  <div
                    onClick={() => setExpandedRepoId(isExpanded ? null : repo.id)}
                    className={`grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_80px_90px_70px_48px] items-start sm:items-center gap-2 sm:gap-6 cursor-pointer select-none ${
                      isExpanded ? "pb-3.5 border-b-[1.5px] border-black/15" : "py-3.5 sm:py-4"
                    }`}
                  >
                    {/* Column 1: Repo Name, Badges, Full Identifier */}
                    <div className="flex flex-col min-w-0 pr-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-sm sm:text-[15px] text-black tracking-tight hover:underline">
                          {highlightMatch(repo.name, searchQuery)}
                        </span>
                        {repo.isFork && (
                          <span className="inline-flex items-center text-[9.5px] font-mono font-bold uppercase px-1.5 py-0.5 border-[1.5px] border-black rounded bg-white text-black select-none">
                            FORK
                          </span>
                        )}
                        {repo.isArchived && (
                          <span className="inline-flex items-center text-[9.5px] font-mono font-bold uppercase px-1.5 py-0.5 border-[1.5px] border-black rounded bg-[#FF6B6B] text-black select-none">
                            ARCHIVED
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] font-mono text-gray-500 truncate max-w-full mt-0.5">
                        {highlightMatch(repo.fullName, searchQuery)}
                      </span>
                    </div>

                    {/* Column 2: Visibility */}
                    <div className="hidden sm:flex items-center justify-end text-right">
                      {repo.isPrivate ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-gray-800">
                          <Lock className="size-2.5" /> Private
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-[10px] font-mono font-bold text-gray-500">
                          Public
                        </span>
                      )}
                    </div>

                    {/* Column 3: Commits Metric */}
                    <div className="hidden sm:block text-right">
                      <span className="font-mono font-black text-xs text-black block">
                        {repo.commitCount.toLocaleString()} commits
                      </span>
                    </div>

                    {/* Column 4: Activity */}
                    <div className="hidden sm:block text-right">
                      <span className="text-[11px] font-mono font-bold text-gray-600 block">
                        {repo.daysSinceLastPush === 0 ? "Today" : `${repo.daysSinceLastPush}d ago`}
                      </span>
                    </div>

                    {/* Column 5: Details Toggle Chevron */}
                    <div className="hidden sm:flex items-center justify-end">
                      <ChevronDown
                        className={`size-4 stroke-[2.5] text-gray-600 transition-transform duration-300 ease-out ${
                          isExpanded ? "rotate-180 text-black" : ""
                        }`}
                      />
                    </div>

                    {/* Mobile Row Summary */}
                    <div className="flex sm:hidden items-center justify-between text-xs font-mono font-bold pt-1 border-t border-black/5 text-gray-700 w-full">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-black">{repo.commitCount} commits</span>
                        <span className="text-[10px] text-gray-500 uppercase">
                          · {repo.isPrivate ? "Private" : "Public"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-gray-500">
                          {repo.daysSinceLastPush === 0 ? "Today" : `${repo.daysSinceLastPush}d ago`}
                        </span>
                        <ChevronDown
                          className={`size-4 stroke-[2.5] transition-transform duration-300 ease-out ${
                            isExpanded ? "rotate-180" : ""
                          }`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Expanded Detailed Repository Dossier Content (Smooth CSS Grid Transition) */}
                  <div
                    className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${
                      isExpanded
                        ? "grid-rows-[1fr] opacity-100"
                        : "grid-rows-[0fr] opacity-0 pointer-events-none"
                    }`}
                  >
                    <div className="overflow-hidden">
                      <div className="pt-4 pb-1.5 px-1 flex flex-col gap-5 text-black">
                    {/* Header & Quick Action Buttons */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-black/10 pb-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-black uppercase tracking-wider text-gray-500">
                            SPECIMEN DOSSIER
                          </span>
                        </div>
                        <h3 className="font-mono font-black text-base sm:text-lg text-black mt-0.5">
                          {highlightMatch(repo.fullName, searchQuery)}
                        </h3>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap pr-1.5 pb-0.5">
                        <a
                          href={`https://github.com/${repo.fullName}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-black bg-[#FFDC58] hover:bg-[#ffe27a] text-black px-3.5 py-1.5 border-[2px] border-black rounded-[6px] shadow-[2px_2px_0_0_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0_0_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer"
                        >
                          OPEN ON GITHUB <ExternalLink className="size-3.5" />
                        </a>
                      </div>
                    </div>

                    {/* Core Engineering Activity Metrics Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 text-xs">
                      <div className="border-[1.5px] border-black p-3 rounded-[6px] bg-white flex flex-col items-center justify-center text-center">
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

                      <div className="border-[1.5px] border-black p-3 rounded-[6px] bg-white flex flex-col items-center justify-center text-center">
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

                      <div className="border-[1.5px] border-black p-3 rounded-[6px] bg-white flex flex-col items-center justify-center text-center">
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

                      <div className="border-[1.5px] border-black p-3 rounded-[6px] bg-white flex flex-col items-center justify-center text-center">
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
                      <div className="border-[1.5px] border-black p-3.5 rounded-[8px] bg-white flex flex-col gap-2.5">
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

                        {/* Language Legends (Unboxed & Centered) */}
                        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 pt-1 text-[11px] font-mono">
                          {repo.languages.map((l, idx) => (
                            <div
                              key={l.name}
                              className="inline-flex items-center gap-1.5"
                            >
                              <span
                                className="size-2 rounded-full border border-black/40 shrink-0"
                                style={{
                                  backgroundColor:
                                    LANGUAGE_COLORS[idx % LANGUAGE_COLORS.length],
                                }}
                              />
                              <span className="font-bold text-black">{highlightMatch(l.name, searchQuery)}</span>
                              <span className="text-gray-500 font-medium">
                                {l.percentage > 0 ? `${l.percentage}%` : "<1%"}
                              </span>
                              <span className="text-gray-400 text-[10px]">
                                ({(l.bytes / 1024).toFixed(1)} KB)
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Timeline & Traceability Links */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-3 pt-1.5 border-t border-black/10 text-[11px] font-mono text-gray-600 font-bold text-center sm:text-left w-full">
                      <div className="flex items-center justify-center sm:justify-start gap-2 sm:gap-3 flex-wrap w-full sm:w-auto">
                        <span>Created: {repo.createdAt.slice(0, 10)}</span>
                        <span>•</span>
                        <span>Last Push: {repo.lastPushedAt.slice(0, 10)}</span>
                      </div>

                      <div className="flex items-center justify-center sm:justify-end gap-4 w-full sm:w-auto">
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
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  </div>
</div>

      {/* 05. Repository Awards Overview */}
      {awards.length > 0 && (
        <div id="section-distinctions" className="border-[4px] border-black bg-white rounded-[12px] p-4 sm:p-6 shadow-[3.5px_3.5px_0_0_#000] flex flex-col gap-5 sm:gap-6 text-black">
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b-[3px] border-black pb-4">
            <div>
              <div className="flex items-center gap-2.5">
                <Trophy className="size-5 sm:size-6 text-black stroke-[2.2] shrink-0" />
                <h2 className="text-xl font-bold uppercase tracking-tight text-black">
                  DISTINCTIONS FROM THE LAB
                </h2>
              </div>
              <p className="text-xs font-bold text-neutral-800 mt-1">
                Some repositories left a bigger mark on the record than others.
              </p>
            </div>
          </div>

          {/* In-Box Grid Cards with Minimal Drop Shadows (2 Per Row) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
            {awards.map((award) => {
              return (
                <div
                  key={award.id}
                  className="border-[2px] border-black bg-[#FFFBEB] rounded-[8px] p-4 sm:p-5 shadow-[1.5px_1.5px_0_0_#000] flex flex-col justify-between gap-4 text-black hover:translate-x-[0.5px] hover:translate-y-[0.5px] hover:shadow-[1px_1px_0_0_#000] transition-all"
                >
                  <div className="flex flex-col gap-3">
                    {/* Header: Direct Emoji + Title */}
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl select-none shrink-0" role="img" aria-label={award.title}>
                        {award.badge}
                      </span>
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-gray-500 block">
                          DISTINCTION
                        </span>
                        <h3 className="text-sm sm:text-base font-black uppercase tracking-tight text-black leading-tight">
                          {award.title}
                        </h3>
                      </div>
                    </div>

                    {/* Interactive Clickable Repository Link */}
                    <a
                      href={`https://github.com/${award.repoFullName}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-fit max-w-full px-2.5 py-1 bg-white hover:bg-[#FFDC58] text-black border-[1.5px] border-black rounded-[6px] shadow-[1px_1px_0_0_#000] hover:translate-x-[0.5px] hover:translate-y-[0.5px] hover:shadow-none text-xs font-mono font-bold flex items-center gap-1.5 transition-all truncate group/repo"
                      title={`Open ${award.repoFullName} on GitHub`}
                    >
                      <FolderGit2 className="size-3 text-gray-700 group-hover/repo:text-black shrink-0" />
                      <span className="truncate">{award.repoFullName}</span>
                      <ExternalLink className="size-2.5 text-gray-400 group-hover/repo:text-black shrink-0 ml-0.5" />
                    </a>

                    {/* Description */}
                    <p className="text-xs font-semibold text-gray-800 leading-relaxed">
                      {award.description}
                    </p>
                  </div>

                  {/* Evidence Drawer */}
                  <div className="bg-white border-[1.5px] border-black/30 rounded-[6px] p-3 flex flex-col gap-1 mt-auto">
                    <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-gray-700">
                      <CheckCircle2 className="size-3 text-emerald-700 shrink-0" />
                      <span>EVIDENCE</span>
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
