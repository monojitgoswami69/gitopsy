"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { gitopsyDb } from "@/lib/db";
import { GitopsyAnalysis, DeterministicEasterEgg } from "@/types/domain";
import { SubjectHeader } from "@/components/forensic/SubjectHeader";
import { HeadlineMetrics } from "@/components/forensic/HeadlineMetrics";
import { RepositorySection } from "@/components/forensic/RepositorySection";
import { CommitForensicsSection } from "@/components/forensic/CommitForensicsSection";
import { ClassificationsSection } from "@/components/forensic/ClassificationsSection";
import { CourtSection } from "@/components/forensic/CourtSection";
import { DataManagementSection } from "@/components/forensic/DataManagementSection";
import { WrappedViewer } from "@/components/forensic/WrappedViewer";
import { EasterEggModal } from "@/components/forensic/EasterEggModal";
import { DossierIndexNav } from "@/components/layout/DossierIndexNav";
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
  Sparkles,
  RefreshCw,
  Zap,
  Lightbulb,
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
  const [isWrappedOpen, setIsWrappedOpen] = useState(false);
  const [selectedEgg, setSelectedEgg] = useState<DeterministicEasterEgg | null>(null);

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

  // Format heatmap data based on selected metric
  const heatmapData =
    heatmapMetric === "LINES"
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
    <div className="w-full relative pb-16">
      {/* Standalone Left Sidebar Index Navigation */}
      <DossierIndexNav onLaunchWrapped={() => setIsWrappedOpen(true)} />

      {/* Main Continuous Flowing Dossier */}
      <div className="w-full lg:pl-56 xl:pl-68 flex flex-col gap-10 min-w-0 pr-2 sm:pr-4">
        {/* 01. Subject Profile Header */}
        <SubjectHeader
          subject={analysis.subject}
          primaryClassification={analysis.primaryClassification}
        />

        {/* 02. Executive Headline Metrics / Case Summary */}
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

        {/* 03. Contribution Activity & Heatmap */}
        <div id="section-activity" className="border-[4px] border-black bg-white rounded-[12px] p-5 shadow-[6px_6px_0_0_#000] flex flex-col gap-2.5 text-black">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b-[3px] border-black pb-3">
            <div>
              <div className="flex items-center gap-2">
                <Calendar className="size-5 sm:size-6 text-black" />
                <h2 className="text-lg sm:text-xl font-black uppercase tracking-tight">
                  03. CONTRIBUTION ACTIVITY &amp; ANNUAL HEATMAP
                </h2>
              </div>
              <p className="text-xs font-bold text-gray-600 mt-0.5">
                Daily author timestamp cadence collected directly from version control logs in your local timezone ({userTz}).
              </p>
            </div>

            <Tabs value={heatmapMetric} onValueChange={(v) => setHeatmapMetric(v as any)}>
              <TabsList>
                <TabsTrigger value="COMMITS">COMMITS</TabsTrigger>
                <TabsTrigger value="LINES">LINES CHURNED</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <HeatmapChart data={heatmapData} metricLabel={heatmapMetric} />

          {/* Peak Activity Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 border-t-[2px] border-black/15 pt-2.5">
            <div className="border-[2px] border-black bg-amber-50 p-2.5 py-2 rounded-[6px] text-center">
              <span className="text-[10px] font-black uppercase text-gray-500">PEAK ACTIVITY HOUR</span>
              <div className="text-lg sm:text-xl font-black font-mono mt-0.5 text-black">
                {analysis.summary.busiestHour}:00 {tzAbbr}
              </div>
            </div>
            <div className="border-[2px] border-black bg-amber-50 p-2.5 py-2 rounded-[6px] text-center">
              <span className="text-[10px] font-black uppercase text-gray-500">BUSIEST WEEKDAY</span>
              <div className="text-lg sm:text-xl font-black mt-0.5 text-black">
                {analysis.summary.busiestWeekday}
              </div>
            </div>
            <div className="border-[2px] border-black bg-amber-50 p-2.5 py-2 rounded-[6px] text-center">
              <span className="text-[10px] font-black uppercase text-gray-500">BUSIEST MONTH</span>
              <div className="text-lg sm:text-xl font-black mt-0.5 text-black">
                {(() => {
                  const m = analysis.summary.busiestMonth;
                  if (!m || !m.includes("-")) return m || "N/A";
                  const [year, month] = m.split("-").map(Number);
                  if (!year || !month || isNaN(year) || isNaN(month)) return m;
                  return new Date(year, month - 1, 1).toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                  });
                })()}
              </div>
            </div>
          </div>
        </div>

        {/* 04. Temporal Forensics */}
        <div id="section-temporal" className="border-[4px] border-black bg-white rounded-[12px] p-6 shadow-[8px_8px_0_0_#000] flex flex-col gap-6 text-black">
          <div className="flex items-center justify-between border-b-[3px] border-black pb-4">
            <div>
              <div className="flex items-center gap-2">
                <Clock className="size-6 text-black" />
                <h2 className="text-xl font-black uppercase tracking-tight">
                  04. TEMPORAL PROFILE &amp; CADENCE
                </h2>
              </div>
              <p className="text-xs font-bold text-gray-600 mt-0.5">
                24-hour clock and weekday distributions in your local timezone ({userTz}).
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="border-[2px] border-black bg-amber-50 p-3 rounded">
              <span className="text-[10px] font-black uppercase text-gray-500">NOCTURNAL RATIO (21:00-04:59 {tzAbbr})</span>
              <div className="text-2xl font-black font-mono mt-1 text-purple-700">
                {analysis.summary.nightCommitPercentage}%
              </div>
            </div>
            <div className="border-[2px] border-black bg-amber-50 p-3 rounded">
              <span className="text-[10px] font-black uppercase text-gray-500">WEEKEND CADENCE (SAT &amp; SUN)</span>
              <div className="text-2xl font-black font-mono mt-1 text-blue-700">
                {analysis.summary.weekendCommitPercentage}%
              </div>
            </div>
            <div className="border-[2px] border-black bg-amber-50 p-3 rounded">
              <span className="text-[10px] font-black uppercase text-gray-500">LONGEST STREAK</span>
              <div className="text-2xl font-black font-mono mt-1 text-amber-600">
                {analysis.summary.longestStreakDays} DAYS
              </div>
            </div>
            <div className="border-[2px] border-black bg-amber-50 p-3 rounded">
              <span className="text-[10px] font-black uppercase text-gray-500">TOTAL ACTIVE DAYS</span>
              <div className="text-2xl font-black font-mono mt-1 text-emerald-700">
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

        {/* 05. Repositories & 06. Repository Distinctions */}
        <RepositorySection
          repositories={analysis.repositories}
          awards={analysis.awards}
        />

        {/* 07. Language DNA & Dialects */}
        <div id="section-languages" className="border-[4px] border-black bg-white rounded-[12px] p-6 shadow-[8px_8px_0_0_#000] flex flex-col gap-6 text-black">
          <div className="flex items-center justify-between border-b-[3px] border-black pb-4">
            <div>
              <div className="flex items-center gap-2">
                <Globe2 className="size-6 text-black" />
                <h2 className="text-xl font-black uppercase tracking-tight">
                  07. PROGRAMMING LANGUAGE DNA &amp; COMPOSITION
                </h2>
              </div>
              <p className="text-xs font-bold text-gray-600 mt-0.5">
                Exact language byte distributions across all examined repositories.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-6 flex flex-col items-center justify-center w-full">
              <LanguagesSunburst languages={analysis.languages} />
            </div>

            <div className="lg:col-span-6 flex flex-col justify-center">
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
                        {lang.isFunctional === false && (
                          <span className="text-[8px] font-mono font-bold text-gray-500 bg-gray-100 px-1 rounded border border-gray-300 shrink-0">
                            DOC
                          </span>
                        )}
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

        {/* 08. Commit Message Forensics & Churn */}
        <CommitForensicsSection commitForensics={analysis.commitForensics} />

        {/* 09. Code Churn Blast Radius */}
        <div id="section-churn" className="border-[4px] border-black bg-white rounded-[12px] p-6 shadow-[8px_8px_0_0_#000] flex flex-col gap-6 text-black">
          <div className="flex items-center justify-between border-b-[3px] border-black pb-4">
            <div>
              <div className="flex items-center gap-2">
                <FileCode2 className="size-6 text-black" />
                <h2 className="text-xl font-black uppercase tracking-tight">
                  09. HISTORICAL MONTHLY CODE CHURN
                </h2>
              </div>
              <p className="text-xs font-bold text-gray-600 mt-0.5">
                Net additions (+lines) and deletions (-lines) plotted across time from historical commit diffs.
              </p>
            </div>
          </div>

          <ChurnAreaChart monthlyData={analysis.activity.byMonth.map((m) => ({ ...m, count: m.commits }))} />
        </div>

        {/* 10. Collaboration Record */}
        <div id="section-collaboration" className="border-[4px] border-black bg-white rounded-[12px] p-6 shadow-[8px_8px_0_0_#000] flex flex-col gap-6 text-black">
          <div className="flex items-center justify-between border-b-[3px] border-black pb-4">
            <div>
              <div className="flex items-center gap-2">
                <GitPullRequest className="size-6 text-black" />
                <h2 className="text-xl font-black uppercase tracking-tight">
                  10. COLLABORATION RECORD &amp; PULL REQUESTS
                </h2>
              </div>
              <p className="text-xs font-bold text-gray-600 mt-0.5">
                Verified pull request throughput, code reviews submitted, and multi-contributor footprint.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="border-[2px] border-black p-3.5 rounded-[8px] bg-amber-50 shadow-[2px_2px_0_0_#000]">
              <span className="text-[10px] font-black uppercase text-gray-500">PRs AUTHORED</span>
              <div className="text-2xl font-black font-mono mt-1 text-black">
                {analysis.summary.prsAuthored}
              </div>
              <span className="text-[10px] text-gray-600 font-bold">{analysis.summary.prsMerged} merged</span>
            </div>

            <div className="border-[2px] border-black p-3.5 rounded-[8px] bg-amber-50 shadow-[2px_2px_0_0_#000]">
              <span className="text-[10px] font-black uppercase text-gray-500">MERGE COMPLETION</span>
              <div className="text-2xl font-black font-mono mt-1 text-emerald-700">
                {analysis.summary.mergeRatePercentage !== null ? `${analysis.summary.mergeRatePercentage}%` : "N/A"}
              </div>
              <span className="text-[10px] text-gray-600 font-bold">of authored PRs</span>
            </div>

            <div className="border-[2px] border-black p-3.5 rounded-[8px] bg-amber-50 shadow-[2px_2px_0_0_#000]">
              <span className="text-[10px] font-black uppercase text-gray-500">CODE REVIEWS SUBMITTED</span>
              <div className="text-2xl font-black font-mono mt-1 text-blue-700">
                {analysis.summary.reviewsAuthored}
              </div>
              <span className="text-[10px] text-gray-600 font-bold">peer reviews</span>
            </div>

            <div className="border-[2px] border-black p-3.5 rounded-[8px] bg-amber-50 shadow-[2px_2px_0_0_#000]">
              <span className="text-[10px] font-black uppercase text-gray-500">MULTI-CONTRIBUTOR SHARE</span>
              <div className="text-2xl font-black font-mono mt-1 text-purple-700">
                {analysis.summary.multiContributorRepoShare || 0}%
              </div>
              <span className="text-[10px] text-gray-600 font-bold">collaborative repos</span>
            </div>
          </div>
        </div>

        {/* 11. Deterministic Developer Classifications */}
        <ClassificationsSection classifications={analysis.classifications} />

        {/* 12. Verified Findings */}
        <div id="section-findings" className="border-[4px] border-black bg-white rounded-[12px] p-6 shadow-[8px_8px_0_0_#000] flex flex-col gap-6 text-black">
          <div className="flex items-center justify-between border-b-[3px] border-black pb-4">
            <div>
              <div className="flex items-center gap-2">
                <Lightbulb className="size-6 text-[#FD9745]" />
                <h2 className="text-xl font-black uppercase tracking-tight">
                  12. VERIFIED FINDINGS &amp; OBSERVATIONS
                </h2>
              </div>
              <p className="text-xs font-bold text-gray-600 mt-0.5">
                Objective observations derived strictly from verified GitHub activity records.
              </p>
            </div>
          </div>

          {/* Findings Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {analysis.findings.map((finding) => (
              <div
                key={finding.id}
                className="border-[3px] border-black bg-amber-50/70 rounded-[8px] p-4 shadow-[3px_3px_0_0_#000] flex flex-col justify-between gap-2 hover:translate-x-[1.5px] hover:translate-y-[1.5px] hover:shadow-[1.5px_1.5px_0_0_#000] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all duration-150"
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{finding.icon}</span>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-black uppercase text-gray-500">{finding.category}</span>
                    <p className="text-sm font-black text-black leading-snug">{finding.title}</p>
                  </div>
                </div>
                <div className="border-t-[2px] border-black/10 pt-2 text-[11px] font-mono text-gray-700 font-bold">
                  Evidence: {finding.evidence}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 13. Gitopsy Courtroom */}
        <CourtSection
          charges={analysis.courtCharges}
          defendantLogin={analysis.subject.login}
        />

        {/* 14. Special Findings & Case Notes */}
        {analysis.easterEggs.length > 0 && (
          <div id="section-case-notes" className="border-[4px] border-black bg-white rounded-[12px] p-6 shadow-[8px_8px_0_0_#000] flex flex-col gap-6 text-black">
            <div className="flex items-center justify-between border-b-[3px] border-black pb-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Zap className="size-6 text-purple-700" />
                  <h2 className="text-xl font-black uppercase tracking-tight">
                    14. SPECIAL FINDINGS &amp; CASE NOTES
                  </h2>
                  <Badge variant="purple">{analysis.easterEggs.length}</Badge>
                </div>
                <p className="text-xs font-bold text-gray-600 mt-0.5">
                  Distinct statistical milestones and notable discoveries identified during the examination.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {analysis.easterEggs.map((egg) => (
                <div
                  key={egg.id}
                  onClick={() => setSelectedEgg(egg)}
                  className="border-[2px] border-black bg-purple-100 p-3 rounded-[6px] shadow-[3px_3px_0_0_#000] flex flex-col justify-between gap-2 cursor-pointer hover:translate-x-[1.5px] hover:translate-y-[1.5px] hover:shadow-[1.5px_1.5px_0_0_#000] hover:bg-purple-200 active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all duration-150"
                >
                  <div className="flex items-center justify-between">
                    <Badge variant="purple">DISCOVERED</Badge>
                    <Sparkles className="size-3.5 text-purple-800" />
                  </div>
                  <h4 className="font-black text-xs uppercase text-black">{egg.title}</h4>
                  <div className="text-[10px] font-mono text-gray-600 truncate font-bold">{egg.trigger}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 15. Wrapped Recap & Launcher */}
        <div id="section-wrapped" className="border-[4px] border-black bg-[#FFDC58] rounded-[12px] p-6 shadow-[8px_8px_0_0_#000] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 text-black">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Badge variant="coral">EXAMINATION SUMMARY</Badge>
              <h2 className="text-2xl font-black uppercase tracking-tight">
                15. GITOPSY FORENSIC WRAPPED
              </h2>
            </div>
            <p className="text-xs font-bold text-gray-800 max-w-lg leading-relaxed">
              Launch the full-screen 15-chapter presentation summarizing your headline records,
              dominant repository, and developer assessment.
            </p>
          </div>

          <Button
            size="lg"
            variant="accent"
            onClick={() => setIsWrappedOpen(true)}
            className="whitespace-nowrap shadow-[4px_4px_0_0_#000]"
          >
            <Sparkles className="size-5" /> LAUNCH WRAPPED (FULL SCREEN)
          </Button>
        </div>

        {/* 16. Data Management & Privacy */}
        <DataManagementSection
          analysis={analysis}
          onAnalysisUpdated={(a) => setAnalysis(a)}
        />
      </div>

      {/* Full-Screen Wrapped Modal */}
      {isWrappedOpen && (
        <WrappedViewer
          report={analysis}
          onClose={() => setIsWrappedOpen(false)}
        />
      )}

      {/* Case Note / Special Finding Modal */}
      {selectedEgg && (
        <EasterEggModal
          egg={selectedEgg}
          isOpen={Boolean(selectedEgg)}
          onClose={() => setSelectedEgg(null)}
        />
      )}
    </div>
  );
}
