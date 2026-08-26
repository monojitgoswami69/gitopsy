"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { GitopsyAnalysis } from "@/types/domain";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, X, Sparkles, Share2 } from "lucide-react";
import confetti from "canvas-confetti";

export function WrappedViewer({
  report,
  onClose,
}: {
  report: GitopsyAnalysis;
  onClose: () => void;
}) {
  const [chapter, setChapter] = useState(0);

  const topRepo = report.repositories[0] || { name: "N/A", commitCount: 0, stars: 0 };
  const topLang = report.languages[0] || { name: "N/A", percentage: 0 };
  const largestCommit = report.commitForensics.largestCommit;

  const chapters = [
    {
      title: "GITOPSY FORENSIC WRAPPED",
      tag: "CONFIDENTIAL",
      bg: "bg-[#FFDC58]",
      content: (
        <div className="flex flex-col items-center text-center gap-4">
          <div className="relative size-24 md:size-32 overflow-hidden rounded-[16px] border-[3px] border-black bg-white shadow-[4px_4px_0_0_#000] animate-bounce">
            <Image
              src="/gitopsy-logo.png"
              alt="Gitopsy Logo"
              fill
              className="object-cover"
              priority
            />
          </div>
          <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tight">
            YOUR GITHUB, UNDER EXAMINATION
          </h1>
          <p className="text-lg md:text-xl font-black max-w-xl text-black">
            Subject: @{report.subject.login}
          </p>
          <span className="text-xs font-mono font-bold bg-black text-[#FFDC58] px-3 py-1 rounded">
            CASE #{report.id.slice(0, 14)}
          </span>
        </div>
      ),
    },
    {
      title: "TOTAL COMMIT EVIDENCE",
      tag: "EVIDENCE #1",
      bg: "bg-[#4D96FF]",
      content: (
        <div className="flex flex-col items-center text-center gap-3">
          <span className="text-lg font-black uppercase">We tracked your author timestamps</span>
          <div className="text-7xl md:text-9xl font-black font-mono my-2 text-black">
            {report.summary.totalCommits.toLocaleString()}
          </div>
          <p className="text-xl font-black uppercase">
            Total Commits Recorded Across {report.summary.reposAnalyzed} Repositories
          </p>
        </div>
      ),
    },
    {
      title: "CODE CHURN DISCLOSURE",
      tag: "EVIDENCE #2",
      bg: "bg-[#6BCB77]",
      content: (
        <div className="flex flex-col items-center text-center gap-4">
          <h2 className="text-3xl md:text-5xl font-black uppercase">Historical Change Volume</h2>
          <div className="flex flex-col sm:flex-row gap-6 my-4">
            <div className="border-[3px] border-black bg-white p-5 rounded-[8px] shadow-[4px_4px_0_0_#000]">
              <div className="text-3xl font-black text-emerald-600 font-mono">
                +{report.summary.linesAdded.toLocaleString()}
              </div>
              <span className="text-xs font-black uppercase">Lines Added</span>
            </div>
            <div className="border-[3px] border-black bg-white p-5 rounded-[8px] shadow-[4px_4px_0_0_#000]">
              <div className="text-3xl font-black text-rose-600 font-mono">
                -{report.summary.linesDeleted.toLocaleString()}
              </div>
              <span className="text-xs font-black uppercase">Lines Incinerated</span>
            </div>
          </div>
          <p className="text-xs font-bold text-gray-800 max-w-md">
            *Historical diff churn only. Not indicative of static codebase volume.
          </p>
        </div>
      ),
    },
    {
      title: "PRIMARY SPECIMEN",
      tag: "EVIDENCE #3",
      bg: "bg-[#FF6B6B]",
      content: (
        <div className="flex flex-col items-center text-center gap-3">
          <span className="text-base font-black uppercase">Most Active Repository</span>
          <div className="text-3xl md:text-6xl font-black uppercase my-2 bg-white px-6 py-3 border-[4px] border-black shadow-[6px_6px_0_0_#000]">
            {topRepo.name}
          </div>
          <p className="text-xl font-black">
            {topRepo.commitCount.toLocaleString()} commits • {topRepo.stars} stars
          </p>
        </div>
      ),
    },
    {
      title: "PRIMARY DIALECT",
      tag: "EVIDENCE #4",
      bg: "bg-[#C084FC]",
      content: (
        <div className="flex flex-col items-center text-center gap-3">
          <span className="text-base font-black uppercase">Top Language Detected</span>
          <div className="text-4xl md:text-7xl font-black uppercase my-2 font-mono bg-white px-6 py-3 border-[4px] border-black shadow-[6px_6px_0_0_#000]">
            {topLang.name}
          </div>
          <p className="text-xl font-black">
            {topLang.percentage}% of all GitHub-reported code bytes
          </p>
        </div>
      ),
    },
    {
      title: "PEAK NOCTURNAL WINDOW",
      tag: "EVIDENCE #5",
      bg: "bg-[#FD9745]",
      content: (
        <div className="flex flex-col items-center text-center gap-3">
          <span className="text-base font-black uppercase">Peak Activity Hour</span>
          <div className="text-6xl md:text-8xl font-black font-mono my-2 text-black">
            {report.summary.busiestHour}:00 {report.summary.timezoneAbbr || "local"}
          </div>
          <p className="text-xl font-black">
            {report.summary.nightCommitPercentage}% of your total commits occurred late at night.
          </p>
        </div>
      ),
    },
    {
      title: "LONGEST CODING STREAK",
      tag: "EVIDENCE #6",
      bg: "bg-[#FFDC58]",
      content: (
        <div className="flex flex-col items-center text-center gap-3">
          <span className="text-base font-black uppercase">Longest Consecutive Days</span>
          <div className="text-7xl md:text-9xl font-black font-mono my-2 text-black">
            {report.summary.longestStreakDays} DAYS
          </div>
          <p className="text-xl font-black max-w-md">
            Uninterrupted daily author timestamps recorded in version control.
          </p>
        </div>
      ),
    },
    {
      title: "FINAL VERDICT & CLASSIFICATION",
      tag: "VERDICT",
      bg: "bg-white",
      content: (
        <div className="flex flex-col items-center text-center gap-4 text-black">
          <Badge variant="coral" className="text-sm px-4 py-1">FINAL DIAGNOSIS</Badge>
          <div
            className="text-2xl md:text-4xl font-black uppercase px-6 py-3 border-[4px] border-black shadow-[6px_6px_0_0_#000]"
            style={{ backgroundColor: report.primaryClassification?.badgeAccent || "#FFDC58" }}
          >
            {report.primaryClassification?.title}
          </div>
          <p className="text-base font-bold max-w-lg italic">
            &ldquo;{report.primaryClassification?.tagline}&rdquo;
          </p>
          <div className="border-[2px] border-black bg-amber-50 p-4 rounded-[8px] text-xs font-mono font-bold max-w-md text-left">
            <div>Subject: @{report.subject.login}</div>
            <div>Total Commits: {report.summary.totalCommits.toLocaleString()}</div>
            <div>Top Language: {topLang.name}</div>
            <div>Evidence Strength: {report.primaryClassification?.evidenceStrength}</div>
          </div>
        </div>
      ),
    },
  ];

  const triggerConfetti = useCallback(() => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });
  }, []);

  useEffect(() => {
    if (chapter === chapters.length - 1) {
      triggerConfetti();
    }
  }, [chapter, chapters.length, triggerConfetti]);

  const handleNext = () => {
    if (chapter < chapters.length - 1) setChapter(chapter + 1);
  };

  const handlePrev = () => {
    if (chapter > 0) setChapter(chapter - 1);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div
        className={`relative w-full max-w-2xl min-h-[500px] border-[5px] border-black rounded-[14px] p-8 md:p-12 shadow-[12px_12px_0_0_#000] flex flex-col justify-between transition-all duration-300 ${chapters[chapter].bg}`}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b-[3px] border-black pb-3">
          <span className="font-mono font-black text-xs uppercase bg-black text-[#FFDC58] px-2 py-0.5 rounded">
            {chapters[chapter].tag}
          </span>
          <span className="font-mono font-black text-xs text-black">
            {chapter + 1} / {chapters.length}
          </span>
          <button
            onClick={onClose}
            className="p-1 rounded bg-white border-2 border-black hover:bg-black hover:text-white transition-all shadow-[2px_2px_0_0_#000]"
            aria-label="Close Wrapped"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Dynamic Center Stage Content */}
        <div className="my-auto py-6 flex items-center justify-center">
          {chapters[chapter].content}
        </div>

        {/* Navigation Controls */}
        <div className="flex items-center justify-between pt-4 border-t-[3px] border-black">
          <Button
            size="sm"
            variant="outline"
            onClick={handlePrev}
            disabled={chapter === 0}
            className={chapter === 0 ? "opacity-30 cursor-not-allowed" : ""}
          >
            <ChevronLeft className="size-4" /> PREVIOUS
          </Button>

          {chapter === chapters.length - 1 ? (
            <Button size="sm" variant="main" onClick={onClose}>
              <Sparkles className="size-4" /> COMPLETE AUTOPSY
            </Button>
          ) : (
            <Button size="sm" variant="main" onClick={handleNext}>
              NEXT <ChevronRight className="size-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
