"use client";

import React from "react";
import { CommitForensics } from "@/types/domain";
import {
  FileCode2,
  Scale,
  Tag,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const INTENT_COLORS = [
  "#4D96FF",
  "#6BCB77",
  "#FD9745",
  "#C084FC",
  "#FF6B6B",
  "#2DD4BF",
  "#FFDC58",
  "#F43F5E",
  "#94A3B8",
];

interface CommitForensicsSectionProps {
  commitForensics: CommitForensics;
}

export function CommitForensicsSection({ commitForensics }: CommitForensicsSectionProps) {
  const {
    totalAnalyzed,
    averageAdditionsPerCommit,
    averageDeletionsPerCommit,
    medianCommitSize,
    averageMessageLength,
    churnRatio,
    sizeDistribution,
    messageCategories,
    shortMessageCount,
    longMessageCount,
    conventionalCommitCount,
    largestCommit,
    topVolumeCommits = largestCommit ? [largestCommit] : [],
  } = commitForensics;

  return (
    <div id="section-commits" className="flex flex-col gap-8">
      <div className="border-[4px] border-black bg-white rounded-[12px] p-6 shadow-[3.5px_3.5px_0_0_#000] flex flex-col gap-6 text-black">
        <div className="flex items-center justify-between border-b-[3px] border-black pb-4">
          <div>
            <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
              <FileCode2 className="size-6 text-black" /> 07. COMMIT FORENSICS &amp; MESSAGE HYGIENE
            </h2>
            <p className="text-xs font-bold text-gray-600">
              Examined {totalAnalyzed.toLocaleString()} historical commits across message intent, character length, and size spectrums.
            </p>
          </div>
        </div>

        {/* Churn Key Numbers */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="border-[1.5px] border-black p-3.5 rounded-[8px] bg-amber-50/70 flex flex-col items-center justify-center text-center">
            <span className="text-[10px] font-black uppercase text-gray-500">AVERAGE COMMIT</span>
            <div className="text-xl font-black font-mono mt-1 text-black">
              <span className="text-emerald-700">+{averageAdditionsPerCommit}</span> / <span className="text-rose-700">-{averageDeletionsPerCommit}</span>
            </div>
            <span className="text-[10px] text-gray-600 font-bold">lines per commit</span>
          </div>

          <div className="border-[1.5px] border-black p-3.5 rounded-[8px] bg-amber-50/70 flex flex-col items-center justify-center text-center">
            <span className="text-[10px] font-black uppercase text-gray-500">MEDIAN COMMIT SIZE</span>
            <div className="text-xl font-black font-mono mt-1">{medianCommitSize} lines</div>
            <span className="text-[10px] text-gray-600 font-bold">50th percentile diff</span>
          </div>

          <div className="border-[1.5px] border-black p-3.5 rounded-[8px] bg-amber-50/70 flex flex-col items-center justify-center text-center">
            <span className="text-[10px] font-black uppercase text-gray-500">AVG MESSAGE LENGTH</span>
            <div className="text-xl font-black font-mono mt-1 text-purple-700">
              {averageMessageLength || 0} chars
            </div>
            <span className="text-[10px] text-gray-600 font-bold">mean character count</span>
          </div>

          <div className="border-[1.5px] border-black p-3.5 rounded-[8px] bg-amber-50/70 flex flex-col items-center justify-center text-center">
            <span className="text-[10px] font-black uppercase text-gray-500">CONVENTIONAL FORMAT</span>
            <div className="text-xl font-black font-mono mt-1 text-blue-700">
              {Math.round((conventionalCommitCount / totalAnalyzed) * 100)}%
            </div>
            <span className="text-[10px] text-gray-600 font-bold">{conventionalCommitCount} structured messages</span>
          </div>
        </div>

        {/* Message Categorization Bar */}
        <div className="flex flex-col gap-3.5 border-[1.5px] border-black p-4 sm:p-5 rounded-[8px] bg-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-gray-700">
              COMMIT MESSAGE INTENT BREAKDOWN
            </span>
            <span className="text-[10px] font-mono font-bold text-gray-500">
              {totalAnalyzed.toLocaleString()} commits analyzed
            </span>
          </div>

          {/* Multi-segment proportional intent bar */}
          <div className="h-3 w-full rounded border border-black overflow-hidden flex bg-gray-100">
            {messageCategories.map((cat, idx) => (
              <div
                key={cat.category}
                style={{
                  width: `${Math.max(1, cat.percentage)}%`,
                  backgroundColor: INTENT_COLORS[idx % INTENT_COLORS.length],
                }}
                title={`${cat.category}: ${cat.count} (${cat.percentage}%)`}
                className="h-full border-r border-black/20 last:border-r-0"
              />
            ))}
          </div>

          {/* Intent Legends (Unboxed & Centered) */}
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 pt-1 text-[11px] font-mono">
            {messageCategories.map((cat, idx) => (
              <div key={cat.category} className="inline-flex items-center gap-1.5">
                <span
                  className="size-2 rounded-full border border-black/40 shrink-0"
                  style={{
                    backgroundColor: INTENT_COLORS[idx % INTENT_COLORS.length],
                  }}
                />
                <span className="font-bold text-black">{cat.category}</span>
                <span className="text-gray-500 font-medium">
                  {cat.count} ({cat.percentage}%)
                </span>
              </div>
            ))}
          </div>

          {/* Additional Hygiene Context */}
          <div className="flex items-center justify-center gap-4 text-[11px] font-mono font-bold text-gray-500 flex-wrap pt-2 border-t border-black/10">
            {shortMessageCount > 0 && (
              <span>⚡ {shortMessageCount} short descriptions (&lt; 10 chars)</span>
            )}
            {shortMessageCount > 0 && longMessageCount > 0 && <span>•</span>}
            {longMessageCount > 0 && (
              <span>📝 {longMessageCount} extended descriptions (≥ 80 chars)</span>
            )}
          </div>
        </div>

        {/* Size Distribution Spectrum */}
        <div className="flex flex-col gap-3">
          <span className="text-xs font-black uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
            <Scale className="size-4" /> COMMIT SIZE SPECTRUM DISTRIBUTION
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="border-[1.5px] border-black p-3 rounded-[6px] bg-amber-50/70 text-center">
              <span className="text-[10px] font-black uppercase text-gray-600">TINY (&lt;10 lines)</span>
              <div className="text-lg font-black font-mono mt-1">{sizeDistribution.tiny}</div>
            </div>
            <div className="border-[1.5px] border-black p-3 rounded-[6px] bg-amber-50/70 text-center">
              <span className="text-[10px] font-black uppercase text-gray-600">SMALL (10-50)</span>
              <div className="text-lg font-black font-mono mt-1">{sizeDistribution.small}</div>
            </div>
            <div className="border-[1.5px] border-black p-3 rounded-[6px] bg-amber-50/70 text-center">
              <span className="text-[10px] font-black uppercase text-gray-600">MEDIUM (50-200)</span>
              <div className="text-lg font-black font-mono mt-1">{sizeDistribution.medium}</div>
            </div>
            <div className="border-[1.5px] border-black p-3 rounded-[6px] bg-amber-50/70 text-center">
              <span className="text-[10px] font-black uppercase text-gray-600">LARGE (200-1k)</span>
              <div className="text-lg font-black font-mono mt-1">{sizeDistribution.large}</div>
            </div>
            <div className="border-[1.5px] border-rose-900 p-3 rounded-[6px] bg-rose-100/80 text-center">
              <span className="text-[10px] font-black uppercase text-rose-900">MONSTER (&gt;1k)</span>
              <div className="text-lg font-black font-mono mt-1 text-rose-900">{sizeDistribution.monster}</div>
            </div>
          </div>
        </div>

        {/* High Volume Commits Section */}
        {topVolumeCommits && topVolumeCommits.length > 0 && (
          <div className="flex flex-col gap-3.5 border-[1.5px] border-black p-4 sm:p-5 rounded-[8px] bg-white">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-gray-700">
                HIGH VOLUME COMMITS
              </span>
              <span className="text-[10px] font-mono font-bold text-gray-500">
                Top {topVolumeCommits.length} commits by line modification volume
              </span>
            </div>

            <div className="flex flex-col gap-2.5">
              {topVolumeCommits.map((c, idx) => (
                <div
                  key={c.sha}
                  className="border-[1.5px] border-black bg-[#FFFDF7] p-3.5 rounded-[6px] flex items-start gap-3.5 transition-all hover:bg-amber-50/50"
                >
                  {/* Rank identifier - nothing underneath this */}
                  <span className="font-mono font-black text-xs text-black shrink-0 pt-0.5">
                    #{idx + 1}
                  </span>

                  {/* Commit Details Body */}
                  <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                      <div className="flex items-center gap-2 flex-wrap font-mono text-xs">
                        <span className="font-mono font-bold text-gray-700">
                          {c.sha.slice(0, 7)}
                        </span>
                        <a
                          href={`https://github.com/${c.repoFullName}/commit/${c.sha}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-bold text-gray-800 hover:underline hover:text-black flex items-center gap-1"
                        >
                          {c.repoFullName} ↗
                        </a>
                        {c.authorDate && (
                          <span className="text-gray-400 text-[11px]">
                            ({c.authorDate.slice(0, 10)})
                          </span>
                        )}
                      </div>

                      <div className="font-mono font-black text-xs shrink-0 text-black">
                        <span className="text-emerald-700">+{c.additions.toLocaleString()}</span>
                        {" / "}
                        <span className="text-rose-700">-{c.deletions.toLocaleString()}</span>
                        {" across "}
                        {c.filesChanged} {c.filesChanged === 1 ? "file" : "files"}
                      </div>
                    </div>

                    <p className="text-xs italic font-semibold text-gray-800 font-mono">
                      &ldquo;{c.message}&rdquo;
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
