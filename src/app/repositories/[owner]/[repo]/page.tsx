"use client";

import React, { use } from "react";
import Link from "next/link";
import { useAutopsyStore } from "@/lib/store/autopsyStore";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Star,
  GitFork,
  FileCode2,
  Calendar,
  GitPullRequest,
  Lock,
  ExternalLink,
} from "lucide-react";

export default function RepositoryAutopsyPage({
  params,
}: {
  params: Promise<{ owner: string; repo: string }>;
}) {
  const resolvedParams = use(params);
  const { owner, repo } = resolvedParams;
  const fullName = `${owner}/${repo}`;
  const { currentAnalysis } = useAutopsyStore();

  const specimen =
    currentAnalysis?.repositories.find(
      (r) => r.fullName.toLowerCase() === fullName.toLowerCase() || r.name.toLowerCase() === repo.toLowerCase()
    ) || currentAnalysis?.repositories[0];

  if (!specimen) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="border-[3px] border-black bg-white p-8 rounded-[8px] font-black">
          SPECIMEN &ldquo;{fullName}&rdquo; NOT FOUND UNDER CURRENT DOSSIER.
        </div>
        <Link href="/autopsy">
          <Button variant="main">RETURN TO DOSSIER</Button>
        </Link>
      </div>
    );
  }

  const isDormant = specimen.daysSinceLastPush > 180;

  return (
    <div className="flex flex-col gap-8 max-w-5xl mx-auto py-6">
      {/* Back Link */}
      <div>
        <Link href="/autopsy">
          <Button size="sm" variant="outline">
            <ArrowLeft className="size-4" /> RETURN TO FORENSIC DOSSIER
          </Button>
        </Link>
      </div>

      {/* Header Banner */}
      <div className="border-[4px] border-black bg-white rounded-[12px] p-4 sm:p-6 shadow-[3.5px_3.5px_0_0_#000] flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sm:gap-6 text-black">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="purple">REPOSITORY DOSSIER</Badge>
            {specimen.isPrivate && <Badge variant="neutral"><Lock className="size-3" /> PRIVATE</Badge>}
            {specimen.isArchived && <Badge variant="dark">ARCHIVED</Badge>}
            <h1 className="text-xl sm:text-2xl md:text-3xl font-black uppercase font-mono">{specimen.name}</h1>
          </div>
          <p className="text-xs font-mono font-bold text-gray-700">{specimen.fullName}</p>
          <div className="flex items-center gap-3 sm:gap-4 text-xs font-bold text-gray-800 mt-1 flex-wrap">
            <span className="flex items-center gap-1">
              <Star className="size-3.5 text-amber-500 fill-amber-500" /> {specimen.stars} stars
            </span>
            <span className="flex items-center gap-1">
              <GitFork className="size-3.5" /> {specimen.forks} forks
            </span>
            <span>Default branch: <strong className="font-mono">{specimen.defaultBranch}</strong></span>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <a
            href={`https://github.com/${specimen.fullName}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-1 text-xs font-black bg-[#FFDC58] hover:bg-[#FD9745] px-4 py-2 border-2 border-black rounded shadow-[2px_2px_0_0_#000] transition-all text-black w-full md:w-auto"
          >
            VIEW ON GITHUB <ExternalLink className="size-3.5" />
          </a>
        </div>
      </div>

      {/* Activity Overview Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4">
        <div className="border-[3px] border-black bg-white p-3.5 sm:p-4 rounded-[10px] shadow-[3px_3px_0_0_#000]">
          <span className="text-[10px] font-black uppercase text-gray-500">ANALYZED COMMITS</span>
          <div className="text-xl sm:text-2xl font-black font-mono mt-1 text-black">{specimen.commitCount}</div>
        </div>
        <div className="border-[3px] border-black bg-white p-3.5 sm:p-4 rounded-[10px] shadow-[3px_3px_0_0_#000]">
          <span className="text-[10px] font-black uppercase text-gray-500">NET CHANGE</span>
          <div className="text-xl sm:text-2xl font-black font-mono mt-1 text-emerald-700">
            {specimen.netLines >= 0 ? "+" : ""}{specimen.netLines.toLocaleString()}
          </div>
        </div>
        <div className="border-[3px] border-black bg-white p-3.5 sm:p-4 rounded-[10px] shadow-[3px_3px_0_0_#000]">
          <span className="text-[10px] font-black uppercase text-gray-500">ACTIVITY SPAN</span>
          <div className="text-xl sm:text-2xl font-black font-mono mt-1 text-blue-700">{specimen.activitySpanDays} DAYS</div>
        </div>
        <div className="border-[3px] border-black bg-white p-3.5 sm:p-4 rounded-[10px] shadow-[3px_3px_0_0_#000]">
          <span className="text-[10px] font-black uppercase text-gray-500">STATUS</span>
          <div className="text-xs sm:text-base font-black uppercase mt-2">
            <Badge variant={isDormant ? "coral" : "lime"}>
              {isDormant ? `DORMANT (${specimen.daysSinceLastPush}d)` : `ACTIVE (${specimen.daysSinceLastPush}d ago)`}
            </Badge>
          </div>
        </div>
      </div>

      {/* Language Breakdown */}
      {specimen.languages.length > 0 && (
        <div className="border-[3px] border-black bg-white rounded-[10px] p-4 sm:p-6 shadow-[3.5px_3.5px_0_0_#000] flex flex-col gap-4 text-black">
          <h3 className="text-base font-black uppercase tracking-tight">
            REPORTED LANGUAGE BYTES IN REPOSITORY
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {specimen.languages.map((lang) => (
              <div
                key={lang.name}
                className="border-[2px] border-black p-3 bg-amber-50 rounded-[6px] flex items-center justify-between"
              >
                <div>
                  <div className="font-black text-sm uppercase">{lang.name}</div>
                  <div className="text-[10px] font-mono text-gray-600 font-bold">
                    {(lang.bytes / 1024).toFixed(1)} KB analyzed
                  </div>
                </div>
                <div className="font-mono font-black text-base bg-white px-2 py-0.5 border border-black rounded shadow-[1px_1px_0_0_#000]">
                  {lang.percentage > 0 ? `${lang.percentage}%` : lang.bytes > 0 ? "<1%" : "0%"}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
