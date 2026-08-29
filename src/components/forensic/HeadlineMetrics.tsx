"use client";

import React from "react";
import { SummaryMetrics, LanguageAnalysis } from "@/types/domain";
import {
  History,
  Layers,
  GitCompareArrows,
  GitMerge,
  Flame,
  Braces,
  MessageSquareCode,
  Trophy,
  Star,
  GitFork,
} from "lucide-react";

interface HeadlineMetricsProps {
  summary: SummaryMetrics;
  topLanguage?: LanguageAnalysis;
}

export function HeadlineMetrics({ summary, topLanguage }: HeadlineMetricsProps) {
  const formatLines = (lines: number) => {
    if (Math.abs(lines) >= 1_000_000) return `${(lines / 1_000_000).toFixed(1)}M`;
    if (Math.abs(lines) >= 1_000) return `${(lines / 1_000).toFixed(1)}k`;
    return lines.toLocaleString();
  };

  const cards = [
    {
      title: "TOTAL COMMITS ANALYZED",
      value: summary.totalCommits.toLocaleString(),
      subtitle: `${summary.totalActiveDays} active days logged`,
      icon: History,
      rotation: -10,
    },
    {
      title: "CONTRIBUTED REPOSITORIES",
      value: summary.reposAnalyzed.toString(),
      subtitle: `${summary.activeRepos} active in last 90 days`,
      icon: Layers,
      rotation: 8,
    },
    {
      title: "HISTORICAL CHURN",
      value: `+${formatLines(summary.linesAdded)} / -${formatLines(summary.linesDeleted)}`,
      subtitle: `Net change: ${summary.netLines >= 0 ? "+" : ""}${formatLines(summary.netLines)} lines`,
      icon: GitCompareArrows,
      rotation: -8,
    },
    {
      title: "PULL REQUESTS MERGED",
      value: `${summary.prsMerged} / ${summary.prsAuthored}`,
      subtitle:
        summary.mergeRatePercentage !== null
          ? `${summary.mergeRatePercentage}% merge completion rate`
          : "No pull requests authored",
      icon: GitMerge,
      rotation: 12,
    },
    {
      title: "LONGEST CODING STREAK",
      value: `${summary.longestStreakDays} DAYS`,
      subtitle: `Current active streak: ${summary.activeStreakDays}d`,
      icon: Flame,
      rotation: -12,
    },
    {
      title: "PRIMARY LANGUAGE",
      value: topLanguage?.name || "N/A",
      subtitle: topLanguage ? `${topLanguage.percentage}% of total bytes` : "No language bytes",
      icon: Braces,
      rotation: 10,
    },
    {
      title: "ISSUES & REVIEWS",
      value: `${summary.issuesAuthored} / ${summary.reviewsAuthored}`,
      subtitle: `${summary.issuesAuthored} issues authored • ${summary.reviewsAuthored} reviews`,
      icon: MessageSquareCode,
      rotation: -8,
    },
    {
      title: "COMMUNITY ENGAGEMENT",
      value: (
        <span className="inline-flex items-center gap-2.5">
          <span className="inline-flex items-center gap-1.5">
            <Star className="size-5 text-amber-500 fill-amber-400 stroke-[2.5]" />
            <span>{summary.starsReceived}</span>
          </span>
          <span className="text-gray-400 font-bold">•</span>
          <span className="inline-flex items-center gap-1.5">
            <GitFork className="size-5 text-black stroke-[2.5]" />
            <span>{summary.forksReceived}</span>
          </span>
        </span>
      ),
      subtitle: "Stars & forks across repositories",
      icon: Trophy,
      rotation: 10,
    },
  ];

  return (
    <div id="section-headlines" className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black uppercase tracking-tight text-black">
          01. EXECUTIVE HEADLINE METRICS
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className="relative overflow-hidden border-[3px] border-black bg-white rounded-[10px] p-4 shadow-[4px_4px_0_0_#000] flex flex-col justify-between gap-3 text-black hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all duration-150 group cursor-default"
            >
              {/* Faint Rotated Watermark Icon strictly layered in background with unified group opacity (no alpha overlap dots) */}
              <div
                className="absolute -right-1 bottom-1 pointer-events-none select-none text-black opacity-[0.05] group-hover:opacity-[0.09] transition-opacity duration-200 z-0"
                style={{ transform: `rotate(${card.rotation}deg)` }}
                aria-hidden="true"
              >
                <Icon className="size-16 sm:size-20 stroke-[1.5]" />
              </div>

              {/* Card Header Title */}
              <div className="relative z-10 flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-gray-600">
                  {card.title}
                </span>
              </div>

              {/* Card Metrics & Subtitle */}
              <div className="relative z-10 pr-2">
                <div className="text-2xl font-black font-mono tracking-tight text-black">
                  {card.value}
                </div>
                <div className="text-xs font-semibold text-gray-600 mt-1">{card.subtitle}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
