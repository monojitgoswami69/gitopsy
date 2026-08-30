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
  Activity,
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
      title: "TOTAL COMMITS",
      value: summary.totalCommits.toLocaleString(),
      subtitle: `${summary.totalActiveDays} active days logged`,
      icon: History,
      rotation: -10,
    },
    {
      title: "CONTRIBUTED REPOS",
      value: summary.reposAnalyzed.toString(),
      subtitle: `${summary.activeRepos} active in last 90d`,
      icon: Layers,
      rotation: 8,
    },
    {
      title: "HISTORICAL CHURN",
      value: (
        <span className="text-[13px] xs:text-sm sm:text-xl tracking-tight">
          +{formatLines(summary.linesAdded)} / -{formatLines(summary.linesDeleted)}
        </span>
      ),
      subtitle: `Net: ${summary.netLines >= 0 ? "+" : ""}${formatLines(summary.netLines)} lines`,
      icon: GitCompareArrows,
      rotation: -8,
    },
    {
      title: "PULL REQUESTS",
      value: `${summary.prsMerged} / ${summary.prsAuthored}`,
      subtitle:
        summary.mergeRatePercentage !== null
          ? `${summary.mergeRatePercentage}% merge rate`
          : "No PRs authored",
      icon: GitMerge,
      rotation: 12,
    },
    {
      title: "LONGEST STREAK",
      value: `${summary.longestStreakDays} DAYS`,
      subtitle: `Current: ${summary.activeStreakDays}d active`,
      icon: Flame,
      rotation: -12,
    },
    {
      title: "PRIMARY LANGUAGE",
      value: topLanguage?.name || "N/A",
      subtitle: topLanguage ? `${topLanguage.percentage}% of code` : "No language code",
      icon: Braces,
      rotation: 10,
    },
    {
      title: "ISSUES & REVIEWS",
      value: `${summary.issuesAuthored} / ${summary.reviewsAuthored}`,
      subtitle: `${summary.issuesAuthored} issues • ${summary.reviewsAuthored} reviews`,
      icon: MessageSquareCode,
      rotation: -8,
    },
    {
      title: "COMMUNITY IMPACT",
      value: (
        <span className="inline-flex items-center gap-2 sm:gap-3">
          <span className="inline-flex items-center gap-1">
            <Star className="size-3.5 sm:size-5 text-black stroke-[2.5]" />
            <span>{summary.starsReceived}</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <GitFork className="size-3.5 sm:size-5 text-black stroke-[2.5]" />
            <span>{summary.forksReceived}</span>
          </span>
        </span>
      ),
      subtitle: "Stars & forks across repos",
      icon: Trophy,
      rotation: 10,
    },
  ];

  return (
    <div id="section-headlines" className="flex flex-col gap-3 sm:gap-4">
      <div className="flex items-center gap-2.5">
        <Activity className="size-5 sm:size-6 text-black stroke-[2.2] shrink-0" />
        <h2 className="text-xl font-bold uppercase tracking-tight text-black">
          EXECUTIVE HEADLINE METRICS
        </h2>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className="relative overflow-hidden border-[2.5px] sm:border-[3px] border-black bg-white rounded-[8px] sm:rounded-[10px] p-2.5 sm:p-4 shadow-[2.5px_2.5px_0_0_#000] sm:shadow-[4px_4px_0_0_#000] flex flex-col justify-between gap-2 sm:gap-3 text-black hover:translate-x-[1.5px] hover:translate-y-[1.5px] hover:shadow-[1.5px_1.5px_0_0_#000] active:translate-x-[2.5px] active:translate-y-[2.5px] active:shadow-none transition-all duration-150 group cursor-default"
            >
              {/* Faint Rotated Watermark Icon strictly layered in background with unified group opacity */}
              <div
                className="absolute -right-1 bottom-1 pointer-events-none select-none text-black opacity-[0.05] group-hover:opacity-[0.09] transition-opacity duration-200 z-0"
                style={{ transform: `rotate(${card.rotation}deg)` }}
                aria-hidden="true"
              >
                <Icon className="size-12 sm:size-20 stroke-[1.5]" />
              </div>

              {/* Card Header Title */}
              <div className="relative z-10 flex items-center justify-between">
                <span className="text-[9.5px] sm:text-[10.5px] font-black uppercase tracking-wider text-gray-600 leading-tight block">
                  {card.title}
                </span>
              </div>

              {/* Card Metrics & Subtitle */}
              <div className="relative z-10 min-w-0">
                <div className="text-sm xs:text-base sm:text-2xl font-black font-mono tracking-tight text-black leading-tight">
                  {card.value}
                </div>
                <div className="text-[10px] sm:text-xs font-semibold text-gray-600 mt-1 leading-snug">
                  {card.subtitle}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
