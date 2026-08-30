"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { gitopsyDb } from "@/lib/db";
import { GitopsyAnalysis } from "@/types/domain";
import { SubjectHeader } from "@/components/forensic/SubjectHeader";
import { HeadlineMetrics } from "@/components/forensic/HeadlineMetrics";
import dynamic from "next/dynamic";
import { RepositorySection } from "@/components/forensic/RepositorySection";
import { CommitForensicsSection } from "@/components/forensic/CommitForensicsSection";
import { ClassificationsSection } from "@/components/forensic/ClassificationsSection";
import { CourtSection } from "@/components/forensic/CourtSection";
import { DataManagementSection } from "@/components/forensic/DataManagementSection";
import { DossierIndexNav } from "@/components/layout/DossierIndexNav";

const WrappedViewer = dynamic(
  () => import("@/components/forensic/WrappedViewer").then((mod) => mod.WrappedViewer),
  { ssr: false }
);
import Image from "next/image";
import { HeatmapChart } from "@/components/charts/HeatmapChart";
import { TemporalHoursChart } from "@/components/charts/TemporalHoursChart";
import { ChurnAreaChart } from "@/components/charts/ChurnAreaChart";
import {
  LanguagesSunburst,
  LANGUAGE_PALETTE,
  groupLanguagesWithOthers,
} from "@/components/charts/LanguagesSunburst";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar,
  Clock,
  Globe2,
  Gift,
  RefreshCw,
  Zap,
  FileCode2,
  ArrowLeft,
  FileText,
  AlertTriangle,
  GitPullRequest,
  Users2,
} from "lucide-react";

export default function AutopsyReportDetailPage() {
  const params = useParams();
  const router = useRouter();
  const reportId = params?.id as string;

  const [analysis, setAnalysis] = useState<GitopsyAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [heatmapMetric, setHeatmapMetric] = useState<"COMMITS" | "LINES">("COMMITS");
  const [isMobile, setIsMobile] = useState(false);
  const [isWrappedOpen, setIsWrappedOpen] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    async function loadReport() {
      if (!reportId) {
        setIsLoading(false);
        return;
      }
      try {
        const found = await gitopsyDb.analyses.get(reportId);
        if (found) {
          setAnalysis(found);
          setLoadError(null);
          document.title = `@${found.subject.login} • Forensic Autopsy Dossier | GITOPSY`;
        } else {
          setLoadError(`Report "${reportId}" not found in local storage.`);
        }
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : String(err));
      } finally {
        setIsLoading(false);
      }
    }

    loadReport();
  }, [reportId]);

  const heatmapData = useMemo(() => {
    if (!analysis) return [];
    return heatmapMetric === "LINES"
      ? analysis.activity.heatmapCalendar.map((d) => {
          const grossChurn = Math.abs(d.additions) + Math.abs(d.deletions);
          // If commits occurred on this day but diff stats were 0, maintain baseline 1 so day is marked active
          const count = grossChurn > 0 ? grossChurn : d.count > 0 ? 1 : 0;
          return {
            date: d.date,
            count,
            commits: d.count,
            additions: d.additions,
            deletions: d.deletions,
          };
        })
      : analysis.activity.heatmapCalendar.map((d) => ({
          date: d.date,
          count: d.count,
          commits: d.count,
          additions: d.additions,
          deletions: d.deletions,
        }));
  }, [analysis, heatmapMetric]);

  const churnData = useMemo(() => {
    if (!analysis?.activity?.byMonth) return [];
    return analysis.activity.byMonth.map((m) => {
      const [year, month] = m.month.split("-").map(Number);
      const date = new Date(year, (month || 1) - 1, 1);
      const label = !isNaN(date.getTime())
        ? date.toLocaleDateString("en-US", { month: "short", year: "2-digit" })
        : m.month;
      const fullLabel = !isNaN(date.getTime())
        ? date.toLocaleDateString("en-US", { month: "long", year: "numeric" })
        : m.month;
      return {
        key: fullLabel,
        label,
        additions: m.additions,
        deletions: m.deletions,
        count: m.commits,
      };
    });
  }, [analysis]);

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-140px)] flex flex-col items-center justify-center text-center max-w-xl mx-auto gap-3 text-black px-4">
        <div className="relative size-10 flex items-center justify-center mb-1">
          <RefreshCw className="size-7 animate-spin text-black stroke-[2.5]" />
        </div>
        <div className="flex flex-col gap-1">
          <span className="font-mono text-xs sm:text-sm font-black tracking-widest uppercase text-black">
            LOADING DOSSIER...
          </span>
          <span className="text-[11px] sm:text-xs font-semibold text-gray-600 font-mono">
            Retrieving forensic examination record #{reportId?.slice(0, 10)}
          </span>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="min-h-[calc(100vh-140px)] flex flex-col items-center justify-center text-center max-w-xl mx-auto gap-5 text-black px-4">
        <FileText className="size-12 text-gray-400" />
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">
            Autopsy Report Not Found
          </h1>
          <p className="text-xs sm:text-sm font-semibold text-gray-600">
            The requested autopsy report ID does not exist or was removed from local storage.
          </p>
          {loadError && (
            <p className="text-xs font-mono text-red-600 mt-2 break-words">
              Error: {loadError}
            </p>
          )}
        </div>
        <Link
          href="/autopsy"
          className="bg-[#FFDC58] text-black border-[3px] border-black px-6 py-3 text-xs font-black uppercase shadow-[4px_4px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#000] transition-all flex items-center gap-2 rounded-xl mt-2"
        >
          <ArrowLeft className="size-4 stroke-[3]" />
          <span>RETURN TO CONSOLE</span>
        </Link>
      </div>
    );
  }

  const userTz =
    analysis.summary.timezone ||
    analysis.activity?.timezone ||
    (typeof Intl !== "undefined" && Intl.DateTimeFormat
      ? Intl.DateTimeFormat().resolvedOptions().timeZone
      : "UTC");

  const tzAbbr =
    analysis.summary.timezoneAbbr ||
    analysis.activity?.timezoneAbbr ||
    (() => {
      try {
        const parts = new Intl.DateTimeFormat("en-US", {
          timeZone: userTz,
          timeZoneName: "short",
        }).formatToParts(new Date());
        return parts.find((p) => p.type === "timeZoneName")?.value || userTz;
      } catch {
        return "Local";
      }
    })();

  return (
    <div className="w-full relative pb-24 lg:pb-16">
      {/* Standalone Left Sidebar Index Navigation */}
      <DossierIndexNav onLaunchWrapped={() => setIsWrappedOpen(true)} />

      {/* Main Continuous Flowing Dossier */}
      <div className="w-full lg:pl-56 xl:pl-68 flex flex-col gap-10 min-w-0 pr-2 sm:pr-4">
        {/* 01. Subject Profile Header */}
        <SubjectHeader
          subject={analysis.subject}
          primaryClassification={analysis.primaryClassification}
          showRepoScope={true}
          contributedRepos={analysis.summary.reposAnalyzed}
        />

        {/* 01. Executive Headline Metrics / Case Summary */}
        <HeadlineMetrics
          summary={analysis.summary}
          topLanguage={analysis.languages[0]}
        />

        {/* Diagnostics Banner (shown if analysis had issues) */}
        {analysis.diagnostics &&
          (analysis.diagnostics.failedRepos.length > 0 ||
            analysis.diagnostics.truncatedRepos.length > 0 ||
            analysis.diagnostics.warnings.length > 0) && (
            <div className="border-[3px] border-amber-500 bg-amber-50 rounded-[12px] p-4 shadow-[4px_4px_0_0_#000] text-black">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="size-5 text-amber-600" />
                <h3 className="text-sm font-black uppercase tracking-tight text-amber-900">
                  Examination Diagnostics
                </h3>
                {analysis.isIncremental && (
                  <Badge variant="cyan" className="text-[10px]">INCREMENTAL</Badge>
                )}
              </div>
              <div className="flex flex-col gap-1.5 text-xs font-mono font-bold text-amber-800">
                {analysis.diagnostics.failedRepos.length > 0 && (
                  <div>
                    {analysis.diagnostics.failedRepos.length} repos failed:{" "}
                    {analysis.diagnostics.failedRepos.map((f) => f.repoFullName).join(", ")}
                  </div>
                )}
                {analysis.diagnostics.truncatedRepos.length > 0 && (
                  <div>
                    {analysis.diagnostics.truncatedRepos.length} repos truncated:{" "}
                    {analysis.diagnostics.truncatedRepos.map((t) => t.repoFullName).join(", ")}
                  </div>
                )}
                {analysis.diagnostics.rateLimitHitCount > 0 && (
                  <div>Rate limit triggered {analysis.diagnostics.rateLimitHitCount} time(s).</div>
                )}
                {analysis.diagnostics.warnings.map((w, i) => (
                  <div key={i}>⚠ {w}</div>
                ))}
              </div>
            </div>
          )}

        {/* 02. Contribution Activity & Heatmap */}
        <div id="section-activity" className="border-[4px] border-black bg-white rounded-[12px] p-4 sm:p-5 shadow-[3.5px_3.5px_0_0_#000] flex flex-col gap-2.5 text-black">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b-[3px] border-black pb-3">
            <div>
              <div className="flex items-center gap-2.5">
                <Calendar className="size-5 sm:size-6 text-black stroke-[2.2] shrink-0" />
                <h2 className="text-lg sm:text-xl font-bold uppercase tracking-tight">
                  CONTRIBUTION ACTIVITY &amp; ANNUAL HEATMAP
                </h2>
              </div>
              <p className="text-xs font-bold text-neutral-800 mt-1">
                Daily author timestamp cadence collected directly from version control logs in your local timezone ({userTz}).
              </p>
            </div>

            <Tabs value={heatmapMetric} onValueChange={(v) => setHeatmapMetric(v as any)} className="w-full sm:w-auto gap-0">
              <TabsList className="w-full sm:w-auto">
                <TabsTrigger value="COMMITS" className="flex-1 sm:flex-initial text-center justify-center">COMMITS</TabsTrigger>
                <TabsTrigger value="LINES" className="flex-1 sm:flex-initial text-center justify-center">LINES CHURNED</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <HeatmapChart data={heatmapData} metricLabel={heatmapMetric} />

          {/* Peak Activity Highlights */}
          <div className="grid grid-cols-3 gap-1.5 sm:gap-3 border-t-[2px] border-black/15 pt-2.5">
            <div className="border-[1.5px] sm:border-[2px] border-black bg-amber-50 p-1.5 sm:p-2.5 py-1.5 sm:py-2 rounded-[6px] text-center flex flex-col justify-center min-w-0">
              <span className="text-[8px] sm:text-[10px] font-black uppercase text-gray-500 tracking-wider">
                PEAK HOUR
              </span>
              <div className="text-[11.5px] sm:text-lg md:text-xl font-black font-mono mt-0.5 text-black">
                {analysis.summary.busiestHour}:00 <span className="text-[9.5px] sm:text-xs text-gray-600 font-bold">{tzAbbr}</span>
              </div>
            </div>

            <div className="border-[1.5px] sm:border-[2px] border-black bg-amber-50 p-1.5 sm:p-2.5 py-1.5 sm:py-2 rounded-[6px] text-center flex flex-col justify-center min-w-0">
              <span className="text-[8px] sm:text-[10px] font-black uppercase text-gray-500 tracking-wider">
                BUSIEST DAY
              </span>
              <div className="text-[11.5px] sm:text-lg md:text-xl font-black mt-0.5 text-black">
                {analysis.summary.busiestWeekday}
              </div>
            </div>

            <div className="border-[1.5px] sm:border-[2px] border-black bg-amber-50 p-1.5 sm:p-2.5 py-1.5 sm:py-2 rounded-[6px] text-center flex flex-col justify-center min-w-0">
              <span className="text-[8px] sm:text-[10px] font-black uppercase text-gray-500 tracking-wider">
                BUSIEST MONTH
              </span>
              <div className="text-[11.5px] sm:text-lg md:text-xl font-black mt-0.5 text-black">
                {(() => {
                  const m = analysis.summary.busiestMonth;
                  if (!m || !m.includes("-")) return m || "N/A";
                  const [year, month] = m.split("-").map(Number);
                  if (!year || !month || isNaN(year) || isNaN(month)) return m;
                  return new Date(year, month - 1, 1).toLocaleDateString("en-US", {
                    month: "short",
                    year: "numeric",
                  });
                })()}
              </div>
            </div>
          </div>
        </div>

        {/* 03. Temporal Forensics */}
        <div id="section-temporal" className="border-[4px] border-black bg-white rounded-[12px] p-4 sm:p-6 shadow-[3.5px_3.5px_0_0_#000] flex flex-col gap-5 sm:gap-6 text-black">
          <div className="flex items-center justify-between border-b-[3px] border-black pb-4">
            <div>
              <div className="flex items-center gap-2.5">
                <Clock className="size-5 sm:size-6 text-black stroke-[2.2] shrink-0" />
                <h2 className="text-xl font-bold uppercase tracking-tight">
                  TEMPORAL PROFILE &amp; CADENCE
                </h2>
              </div>
              <p className="text-xs font-bold text-neutral-800 mt-1">
                24-hour clock and weekday distributions in your local timezone ({userTz}).
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4">
            <div className="border-[2px] border-black bg-amber-50 p-2.5 sm:p-3 rounded-[6px] text-center">
              <span className="text-[9px] sm:text-[10px] font-black uppercase text-gray-500">NOCTURNAL RATIO ({tzAbbr})</span>
              <div className="text-xl sm:text-2xl font-black font-mono mt-1 text-purple-700">
                {analysis.summary.nightCommitPercentage}%
              </div>
            </div>
            <div className="border-[2px] border-black bg-amber-50 p-2.5 sm:p-3 rounded-[6px] text-center">
              <span className="text-[9px] sm:text-[10px] font-black uppercase text-gray-500">WEEKEND CADENCE</span>
              <div className="text-xl sm:text-2xl font-black font-mono mt-1 text-blue-700">
                {analysis.summary.weekendCommitPercentage}%
              </div>
            </div>
            <div className="border-[2px] border-black bg-amber-50 p-2.5 sm:p-3 rounded-[6px] text-center">
              <span className="text-[9px] sm:text-[10px] font-black uppercase text-gray-500">LONGEST STREAK</span>
              <div className="text-xl sm:text-2xl font-black font-mono mt-1 text-amber-600">
                {analysis.summary.longestStreakDays} DAYS
              </div>
            </div>
            <div className="border-[2px] border-black bg-amber-50 p-2.5 sm:p-3 rounded-[6px] text-center">
              <span className="text-[9px] sm:text-[10px] font-black uppercase text-gray-500">TOTAL ACTIVE DAYS</span>
              <div className="text-xl sm:text-2xl font-black font-mono mt-1 text-emerald-700">
                {analysis.summary.totalActiveDays} DAYS
              </div>
            </div>
          </div>

          <TemporalHoursChart
            commitsByHour={analysis.activity.byHour}
            commitsByWeekday={analysis.activity.byWeekday}
            timezoneAbbr={tzAbbr}
          />
        </div>

        {/* 04. Repositories & 05. Repository Distinctions */}
        <RepositorySection
          repositories={analysis.repositories}
          awards={analysis.awards}
        />

        {/* 06. Language DNA & Dialects */}
        <div id="section-languages" className="border-[4px] border-black bg-white rounded-[12px] p-4 sm:p-6 shadow-[3.5px_3.5px_0_0_#000] flex flex-col gap-5 sm:gap-6 text-black">
          <div className="flex items-center justify-between border-b-[3px] border-black pb-4">
            <div>
              <div className="flex items-center gap-2.5">
                <Globe2 className="size-5 sm:size-6 text-black stroke-[2.2] shrink-0" />
                <h2 className="text-xl font-bold uppercase tracking-tight">
                  PROGRAMMING LANGUAGE DNA &amp; COMPOSITION
                </h2>
              </div>
              <p className="text-xs font-bold text-neutral-800 mt-1">
                Exact language byte distributions across all examined repositories.
              </p>
            </div>
          </div>

          <div className="w-full flex justify-center">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-center justify-center w-full max-w-5xl">
              {/* Left Column: Donut Chart & Interactive Legend */}
              <div className="lg:col-span-5 flex flex-col items-center justify-center w-full">
                <LanguagesSunburst languages={analysis.languages} />
              </div>

              {/* Right Column: Clean Detected Dialects List */}
              <div className="lg:col-span-7 flex flex-col justify-center w-full">
                {(() => {
                  const totalLangs = analysis.languages.length;
                  const mid = Math.ceil(totalLangs / 2);
                  const col1 = analysis.languages.slice(0, mid);
                  const col2 = analysis.languages.slice(mid);

                  const renderItem = (lang: (typeof analysis.languages)[0], globalIdx: number) => {
                    const isUnder5 = lang.percentage < 5;
                    const dotColor = isUnder5 ? "#94A3B8" : LANGUAGE_PALETTE[globalIdx % LANGUAGE_PALETTE.length];
                    return (
                      <div
                        key={lang.name}
                        className="flex items-center justify-between py-1.5 border-b border-black/10"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="size-2.5 rounded-full border border-black shrink-0"
                            style={{ backgroundColor: dotColor }}
                          />
                          <span className="font-black text-xs sm:text-[13px] uppercase text-black tracking-tight truncate">
                            {lang.name}
                          </span>
                        </div>

                        <span className="font-mono font-black text-xs sm:text-[13px] text-black shrink-0 pl-1.5">
                          {lang.percentage > 0 ? `${lang.percentage}%` : lang.bytes > 0 ? "<1%" : "0%"}
                        </span>
                      </div>
                    );
                  };

                  return (
                    <>
                      <div className="flex items-center justify-between pb-1.5 mb-1 border-b-[2px] border-black/15">
                        <span className="text-xs font-black uppercase text-gray-700">
                          DETECTED DIALECTS ({analysis.languages.length})
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 items-start">
                        <div className="flex flex-col">{col1.map((lang, idx) => renderItem(lang, idx))}</div>
                        <div className="flex flex-col">{col2.map((lang, idx) => renderItem(lang, mid + idx))}</div>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>

        {/* 07. Commit Message Forensics & Churn */}
        <CommitForensicsSection commitForensics={analysis.commitForensics} />

        {/* 08. Code Churn Blast Radius */}
        <div id="section-churn" className="border-[4px] border-black bg-white rounded-[12px] p-4 sm:p-6 shadow-[3.5px_3.5px_0_0_#000] flex flex-col gap-5 sm:gap-6 text-black">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b-[3px] border-black pb-4">
            <div>
              <div className="flex items-center gap-2.5">
                <FileCode2 className="size-5 sm:size-6 text-black stroke-[2.2] shrink-0" />
                <h2 className="text-xl font-bold uppercase tracking-tight">
                  HISTORICAL CODE CHURN TIMELINE
                </h2>
              </div>
              <p className="text-xs font-bold text-neutral-800 mt-1">
                Gross additions (+lines) and deletions (-lines) plotted across time from version control diffs.
              </p>
            </div>
          </div>

          <ChurnAreaChart data={churnData} />
        </div>

        {/* 09. Collaboration Record */}
        <div id="section-collaboration" className="border-[4px] border-black bg-white rounded-[12px] p-4 sm:p-6 shadow-[3.5px_3.5px_0_0_#000] flex flex-col gap-5 sm:gap-6 text-black">
          <div className="flex items-center justify-between border-b-[3px] border-black pb-4">
            <div>
              <div className="flex items-center gap-2.5">
                <GitPullRequest className="size-5 sm:size-6 text-black stroke-[2.2] shrink-0" />
                <h2 className="text-xl font-bold uppercase tracking-tight">
                  COLLABORATION RECORD &amp; PULL REQUESTS
                </h2>
              </div>
              <p className="text-xs font-bold text-neutral-800 mt-1">
                Verified pull request throughput, code reviews submitted, and multi-contributor footprint.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4">
            <div className="border-[1.5px] border-black p-3 sm:p-3.5 rounded-[8px] bg-amber-50/70 flex flex-col items-center justify-center text-center">
              <span className="text-[10px] font-black uppercase text-gray-500">PRs AUTHORED</span>
              <div className="text-xl sm:text-2xl font-black font-mono mt-1 text-black">
                {analysis.summary.prsAuthored}
              </div>
              <span className="text-[10px] text-gray-600 font-bold">{analysis.summary.prsMerged} merged</span>
            </div>

            <div className="border-[1.5px] border-black p-3 sm:p-3.5 rounded-[8px] bg-amber-50/70 flex flex-col items-center justify-center text-center">
              <span className="text-[10px] font-black uppercase text-gray-500">MERGE COMPLETION</span>
              <div className="text-xl sm:text-2xl font-black font-mono mt-1 text-emerald-700">
                {analysis.summary.mergeRatePercentage !== null ? `${analysis.summary.mergeRatePercentage}%` : "N/A"}
              </div>
              <span className="text-[10px] text-gray-600 font-bold">of authored PRs</span>
            </div>

            <div className="border-[1.5px] border-black p-3 sm:p-3.5 rounded-[8px] bg-amber-50/70 flex flex-col items-center justify-center text-center">
              <span className="text-[10px] font-black uppercase text-gray-500">CODE REVIEWS SUBMITTED</span>
              <div className="text-xl sm:text-2xl font-black font-mono mt-1 text-blue-700">
                {analysis.summary.reviewsAuthored}
              </div>
              <span className="text-[10px] text-gray-600 font-bold">peer reviews</span>
            </div>

            <div className="border-[1.5px] border-black p-3 sm:p-3.5 rounded-[8px] bg-amber-50/70 flex flex-col items-center justify-center text-center">
              <span className="text-[10px] font-black uppercase text-gray-500">MULTI-CONTRIBUTOR SHARE</span>
              <div className="text-xl sm:text-2xl font-black font-mono mt-1 text-purple-700">
                {analysis.summary.multiContributorRepoShare || 0}%
              </div>
              <span className="text-[10px] text-gray-600 font-bold">collaborative repos</span>
            </div>
          </div>
        </div>

        {/* 10. The Gitopsy Awards */}
        <ClassificationsSection classifications={analysis.classifications} />

        {/* 11. Gitopsy Courtroom */}
        <CourtSection
          charges={analysis.courtCharges}
          defendantLogin={analysis.subject.login}
        />

        {/* Wrapped Recap & Launcher */}
        <div id="section-wrapped" className="border-[4px] border-black bg-[#FFDC58] rounded-[12px] p-4 sm:p-6 shadow-[3.5px_3.5px_0_0_#000] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6 text-black">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2.5">
              <Gift className="size-5 sm:size-6 text-black stroke-[2.2] shrink-0" />
              <h2 className="text-xl sm:text-2xl font-bold uppercase tracking-tight">
                GITOPSY FORENSIC WRAPPED
              </h2>
            </div>
            <p className="text-xs font-bold text-neutral-900 max-w-lg leading-relaxed mt-1">
              Launch the full-screen 15-chapter presentation summarizing your headline records,
              dominant repository, and developer assessment.
            </p>
          </div>

          <Button
            size="lg"
            variant="accent"
            onClick={() => setIsWrappedOpen(true)}
            className="whitespace-nowrap shadow-[4px_4px_0_0_#000] w-full sm:w-auto"
          >
            LAUNCH WRAPPED
          </Button>
        </div>

        {/* 14. Data Management & Privacy */}
        <DataManagementSection
          analysis={analysis}
          onAnalysisUpdated={(a) => setAnalysis(a)}
        />

        {/* Footer — Minimalistic (matches landing page) */}
        <footer className="w-full text-center mt-6">
          <div className="pt-6 border-t-2 border-black/20 flex flex-col sm:flex-row items-center justify-between text-xs font-bold uppercase text-gray-700 gap-3 sm:gap-4">
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-2">
              <div className="flex items-center gap-2">
                <div className="relative size-5 shrink-0">
                  <Image
                    src="/gitopsy-logo.png"
                    alt="Gitopsy Logo"
                    width={20}
                    height={20}
                    className="object-contain"
                  />
                </div>
                <span>© Gitopsy {new Date().getFullYear()}</span>
              </div>
              <span className="hidden sm:inline text-black/40">•</span>
              <a
                href="https://github.com/monojitgoswami69/gitopsy"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-black transition-colors flex items-center gap-1.5 hover:underline"
                title="GitHub Repository"
              >
                <svg className="size-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                  />
                </svg>
                <span>GitHub</span>
              </a>
            </div>
            <button
              onClick={() => {
                const el = document.getElementById("app-main-scroll");
                if (el) el.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="hover:underline hover:text-black transition-colors cursor-pointer"
            >
              Back to top ↑
            </button>
          </div>
        </footer>
      </div>

      {/* Full-Screen Wrapped Modal */}
      {isWrappedOpen && (
        <WrappedViewer
          report={analysis}
          onClose={() => setIsWrappedOpen(false)}
        />
      )}
    </div>
  );
}
