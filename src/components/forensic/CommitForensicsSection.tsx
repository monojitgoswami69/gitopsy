"use client";

import React from "react";
import { CommitForensics } from "@/types/domain";
import {
  FileCode2,
  Scale,
  GitCommit,
} from "lucide-react";

interface CommitForensicsSectionProps {
  commitForensics: CommitForensics;
}

export function CommitForensicsSection({ commitForensics }: CommitForensicsSectionProps) {
  const {
    totalAnalyzed,
    averageAdditionsPerCommit,
    averageDeletionsPerCommit,
    medianCommitSize,
    churnRatio,
    sizeDistribution,
    messageCategories,
    shortMessageCount,
    conventionalCommitCount,
    largestCommit,
  } = commitForensics;

  return (
    <div id="section-commits" className="flex flex-col gap-8">
      {/* 07. Commit Forensics & Message Analysis */}
      <div className="border-[4px] border-black bg-white rounded-[12px] p-6 shadow-[8px_8px_0_0_#000] flex flex-col gap-6 text-black">
        <div className="flex items-center justify-between border-b-[3px] border-black pb-4">
          <div>
            <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
              <FileCode2 className="size-6 text-black" /> 06. COMMIT MESSAGE FORENSICS & CHURN
            </h2>
            <p className="text-xs font-bold text-gray-600">
              Examined {totalAnalyzed.toLocaleString()} historical commits across message intent and size spectrums.
            </p>
          </div>
        </div>

        {/* Churn Key Numbers */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="border-[2px] border-black p-3.5 rounded-[8px] bg-amber-50 shadow-[2px_2px_0_0_#000]">
            <span className="text-[10px] font-black uppercase text-gray-500">AVERAGE COMMIT</span>
            <div className="text-xl font-black font-mono mt-1">
              +{averageAdditionsPerCommit} / -{averageDeletionsPerCommit}
            </div>
            <span className="text-[10px] text-gray-600 font-bold">lines per commit</span>
          </div>

          <div className="border-[2px] border-black p-3.5 rounded-[8px] bg-amber-50 shadow-[2px_2px_0_0_#000]">
            <span className="text-[10px] font-black uppercase text-gray-500">MEDIAN COMMIT SIZE</span>
            <div className="text-xl font-black font-mono mt-1">{medianCommitSize} lines</div>
            <span className="text-[10px] text-gray-600 font-bold">50th percentile diff</span>
          </div>

          <div className="border-[2px] border-black p-3.5 rounded-[8px] bg-amber-50 shadow-[2px_2px_0_0_#000]">
            <span className="text-[10px] font-black uppercase text-gray-500">DELETION RATIO</span>
            <div className="text-xl font-black font-mono mt-1 text-rose-700">
              {Math.round(churnRatio * 100)}%
            </div>
            <span className="text-[10px] text-gray-600 font-bold">deletions / total churn</span>
          </div>

          <div className="border-[2px] border-black p-3.5 rounded-[8px] bg-amber-50 shadow-[2px_2px_0_0_#000]">
            <span className="text-[10px] font-black uppercase text-gray-500">CONVENTIONAL COMMITS</span>
            <div className="text-xl font-black font-mono mt-1 text-blue-700">
              {Math.round((conventionalCommitCount / totalAnalyzed) * 100)}%
            </div>
            <span className="text-[10px] text-gray-600 font-bold">{conventionalCommitCount} structured messages</span>
          </div>
        </div>

        {/* Message Categorization Bar */}
        <div className="flex flex-col gap-3 border-[2px] border-black p-4 rounded-[8px] bg-white shadow-[2px_2px_0_0_#000]">
          <span className="text-xs font-black uppercase tracking-wider text-gray-700">
            COMMIT MESSAGE INTENT CATEGORIES
          </span>
          <div className="flex flex-wrap items-center gap-2">
            {messageCategories.map((cat) => (
              <div
                key={cat.category}
                className="border-[2px] border-black bg-[#FFDC58] px-3 py-1.5 rounded-[6px] shadow-[2px_2px_0_0_#000] flex items-center gap-2 text-xs font-black"
              >
                <span>{cat.category}</span>
                <span className="bg-black text-[#FFDC58] px-1.5 py-0.2 rounded font-mono text-[11px]">
                  {cat.count} ({cat.percentage}%)
                </span>
              </div>
            ))}
          </div>
          {shortMessageCount > 0 && (
            <span className="text-[11px] font-bold text-gray-600">
              ⚡ {shortMessageCount} commits had very short descriptions (&lt; 10 characters).
            </span>
          )}
        </div>

        {/* Size Distribution Spectrum */}
        <div className="flex flex-col gap-3">
          <span className="text-xs font-black uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
            <Scale className="size-4" /> COMMIT SIZE SPECTRUM DISTRIBUTION
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="border-[2px] border-black p-3 rounded bg-amber-50 text-center shadow-[1px_1px_0_0_#000]">
              <span className="text-[10px] font-black uppercase text-gray-600">TINY (&lt;10 lines)</span>
              <div className="text-lg font-black font-mono mt-1">{sizeDistribution.tiny}</div>
            </div>
            <div className="border-[2px] border-black p-3 rounded bg-amber-50 text-center shadow-[1px_1px_0_0_#000]">
              <span className="text-[10px] font-black uppercase text-gray-600">SMALL (10-50)</span>
              <div className="text-lg font-black font-mono mt-1">{sizeDistribution.small}</div>
            </div>
            <div className="border-[2px] border-black p-3 rounded bg-amber-50 text-center shadow-[1px_1px_0_0_#000]">
              <span className="text-[10px] font-black uppercase text-gray-600">MEDIUM (50-200)</span>
              <div className="text-lg font-black font-mono mt-1">{sizeDistribution.medium}</div>
            </div>
            <div className="border-[2px] border-black p-3 rounded bg-amber-50 text-center shadow-[1px_1px_0_0_#000]">
              <span className="text-[10px] font-black uppercase text-gray-600">LARGE (200-1k)</span>
              <div className="text-lg font-black font-mono mt-1">{sizeDistribution.large}</div>
            </div>
            <div className="border-[2px] border-black p-3 rounded bg-rose-100 text-center border-rose-900 shadow-[1px_1px_0_0_#000]">
              <span className="text-[10px] font-black uppercase text-rose-900">MONSTER (&gt;1k)</span>
              <div className="text-lg font-black font-mono mt-1 text-rose-900">{sizeDistribution.monster}</div>
            </div>
          </div>
        </div>

        {/* Largest Commit Breakdown */}
        {largestCommit && (
          <div className="border-[2px] border-black bg-amber-50/70 p-4 rounded-[8px] flex flex-col gap-2 shadow-[2px_2px_0_0_#000]">
            <span className="text-[10px] font-black uppercase text-gray-600">
              LARGEST RECORDED COMMIT IN DATASET:
            </span>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div className="font-mono font-bold text-xs">
                SHA: <span className="bg-black text-[#FFDC58] px-1.5 py-0.5 rounded">{largestCommit.sha.slice(0, 10)}</span> in {largestCommit.repoFullName}
              </div>
              <div className="font-mono font-black text-xs text-rose-800">
                +{largestCommit.additions.toLocaleString()} / -{largestCommit.deletions.toLocaleString()} across {largestCommit.filesChanged} files
              </div>
            </div>
            <p className="text-xs italic font-semibold text-gray-800">&ldquo;{largestCommit.message}&rdquo;</p>
          </div>
        )}
      </div>
    </div>
  );
}
