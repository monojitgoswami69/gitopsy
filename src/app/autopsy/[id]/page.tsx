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
import { LanguagesSunburst } from "@/components/charts/LanguagesSunburst";
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
            LOADING AUTOPSY DOSSIER...
          </span>
          <span className="text-[11px] sm:text-xs font-semibold text-gray-600 font-mono">
            Retrieving forensic evidence record #{reportId?.slice(0, 10)}
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
      ? analysis.activity.heatmapCalendar.map((d) => ({
          date: d.date,
          count: d.additions + d.deletions,
        }))
      : analysis.activity.heatmapCalendar.map((d) => ({
          date: d.date,
          count: d.count,
        }));

  return (
    <div className="w-full relative pb-16">
      {/* Standalone Fixed Left Sidebar Index */}
      <DossierIndexNav onLaunchWrapped={() => setIsWrappedOpen(true)} />

      {/* Main Report Dossier Container spanning full available width */}
      <div className="w-full lg:pl-56 xl:pl-68 flex flex-col gap-10 min-w-0 pr-2 sm:pr-4">
        {/* 01. Subject Profile Header */}
        <SubjectHeader
          subject={analysis.subject}
          primaryClassification={analysis.primaryClassification}
        />

      {/* 02. Executive Headline Metrics */}
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
                Analysis Diagnostics
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
      <div id="section-activity" className="border-[4px] border-black bg-white rounded-[12px] p-6 shadow-[8px_8px_0_0_#000] flex flex-col gap-6 text-black">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b-[3px] border-black pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Calendar className="size-6 text-black" />
              <h2 className="text-xl font-black uppercase tracking-tight">
                02. CONTRIBUTION ACTIVITY &amp; ANNUAL HEATMAP
              </h2>
            </div>
            <p className="text-xs font-bold text-gray-600 mt-0.5">
              Daily author timestamp cadence collected directly from version control logs.
            </p>
          </div>

          <Tabs value={heatmapMetric} onValueChange={(v) => setHeatmapMetric(v as any)}>
            <TabsList className="p-1">
              <TabsTrigger value="COMMITS">COMMITS</TabsTrigger>
              <TabsTrigger value="LINES">LINES CHURNED</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <HeatmapChart data={heatmapData} metricLabel={heatmapMetric} />

        {/* Peak Activity Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 border-t-[2px] border-black/15 pt-4">
          <div className="border-[2px] border-black bg-amber-50 p-3 rounded text-center">
            <span className="text-[10px] font-black uppercase text-gray-500">PEAK ACTIVITY HOUR</span>
            <div className="text-xl font-black font-mono mt-0.5 text-black">
              {analysis.summary.busiestHour}:00 UTC
            </div>
          </div>
          <div className="border-[2px] border-black bg-amber-50 p-3 rounded text-center">
            <span className="text-[10px] font-black uppercase text-gray-500">BUSIEST WEEKDAY</span>
            <div className="text-xl font-black mt-0.5 text-black">
              {analysis.summary.busiestWeekday}
            </div>
          </div>
          <div className="border-[2px] border-black bg-amber-50 p-3 rounded text-center">
            <span className="text-[10px] font-black uppercase text-gray-500">BUSIEST MONTH</span>
            <div className="text-xl font-black font-mono mt-0.5 text-black">
              {analysis.summary.busiestMonth}
            </div>
          </div>
        </div>
      </div>

      {/* 03. Temporal Forensics */}
      <div id="section-temporal" className="border-[4px] border-black bg-white rounded-[12px] p-6 shadow-[8px_8px_0_0_#000] flex flex-col gap-6 text-black">
        <div className="flex items-center justify-between border-b-[3px] border-black pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Clock className="size-6 text-black" />
              <h2 className="text-xl font-black uppercase tracking-tight">
                03. TEMPORAL FORENSICS (24-HOUR UTC CLOCK &amp; CADENCE)
              </h2>
            </div>
            <p className="text-xs font-bold text-gray-600 mt-0.5">
              Hourly and weekday distributions highlighting nocturnal activity and weekend ratios.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="border-[2px] border-black bg-amber-50 p-3 rounded">
            <span className="text-[10px] font-black uppercase text-gray-500">NOCTURNAL RATIO (21:00-04:59)</span>
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
        />
      </div>

      {/* 04. Repositories & Awards */}
      <RepositorySection
        repositories={analysis.repositories}
        awards={analysis.awards}
      />

      {/* 05. Language DNA & Dialects */}
      <div id="section-languages" className="border-[4px] border-black bg-white rounded-[12px] p-6 shadow-[8px_8px_0_0_#000] flex flex-col gap-6 text-black">
        <div className="flex items-center justify-between border-b-[3px] border-black pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Globe2 className="size-6 text-black" />
              <h2 className="text-xl font-black uppercase tracking-tight">
                05. PROGRAMMING LANGUAGE DNA &amp; COMPOSITION
              </h2>
            </div>
            <p className="text-xs font-bold text-gray-600 mt-0.5">
              Exact language byte distributions across all examined repositories.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
          <LanguagesSunburst languages={analysis.languages} />

          <div className="flex flex-col gap-3">
            <span className="text-xs font-black uppercase text-gray-700">DETECTED LANGUAGE DIALECTS:</span>
            {analysis.languages.map((lang) => (
              <div
                key={lang.name}
                className="border-[2px] border-black p-3 rounded-[6px] bg-amber-50 flex items-center justify-between shadow-[2px_2px_0_0_#000]"
              >
                <div>
                  <div className="font-black text-sm uppercase text-black">{lang.name}</div>
                  <div className="text-[10px] text-gray-600 font-mono font-bold">
                    {(lang.bytes / 1024).toFixed(1)} KB analyzed across {lang.repoCount} repo(s)
                  </div>
                </div>
                <div className="font-mono font-black text-base bg-white px-2.5 py-1 border border-black rounded shadow-[1px_1px_0_0_#000]">
                  {lang.percentage}%
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 06. Commit Message Forensics & Churn */}
      <CommitForensicsSection commitForensics={analysis.commitForensics} />

      {/* 07. Code Churn Blast Radius */}
      <div id="section-churn" className="border-[4px] border-black bg-white rounded-[12px] p-6 shadow-[8px_8px_0_0_#000] flex flex-col gap-6 text-black">
        <div className="flex items-center justify-between border-b-[3px] border-black pb-4">
          <div>
            <div className="flex items-center gap-2">
              <FileCode2 className="size-6 text-black" />
              <h2 className="text-xl font-black uppercase tracking-tight">
                07. HISTORICAL MONTHLY CODE CHURN (+ ADDITIONS / - DELETIONS)
              </h2>
            </div>
            <p className="text-xs font-bold text-gray-600 mt-0.5">
              Net additions and deletions plotted across time. (Historical diff churn, not static LOC).
            </p>
          </div>
        </div>

        <ChurnAreaChart monthlyData={analysis.activity.byMonth.map((m) => ({ ...m, count: m.commits }))} />
      </div>

      {/* 08. Deterministic Developer Classifications */}
      <ClassificationsSection classifications={analysis.classifications} />

      {/* 09. Gitopsy Courtroom */}
      <CourtSection
        charges={analysis.courtCharges}
        defendantLogin={analysis.subject.login}
      />

      {/* 10. Deterministic Findings & Easter Eggs */}
      <div id="section-findings" className="border-[4px] border-black bg-white rounded-[12px] p-6 shadow-[8px_8px_0_0_#000] flex flex-col gap-6 text-black">
        <div className="flex items-center justify-between border-b-[3px] border-black pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Lightbulb className="size-6 text-[#FD9745]" />
              <h2 className="text-xl font-black uppercase tracking-tight">
                10. VERIFIED FINDINGS &amp; CLASSIFIED EASTER EGGS
              </h2>
            </div>
            <p className="text-xs font-bold text-gray-600 mt-0.5">
              Deterministic trivia and secret discoveries triggered strictly by verified GitHub metrics.
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

        {/* Unlocked Easter Eggs */}
        {analysis.easterEggs.length > 0 && (
          <div className="flex flex-col gap-3 border-t-[2px] border-black/15 pt-4">
            <span className="text-xs font-black uppercase tracking-wider text-purple-900 flex items-center gap-1.5">
              <Zap className="size-4 fill-purple-500" /> CLASSIFIED EASTER EGGS DISCOVERED ({analysis.easterEggs.length})
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {analysis.easterEggs.map((egg) => (
                <div
                  key={egg.id}
                  onClick={() => setSelectedEgg(egg)}
                  className="border-[2px] border-black bg-purple-100 p-3 rounded-[6px] shadow-[3px_3px_0_0_#000] flex flex-col justify-between gap-2 cursor-pointer hover:translate-x-[1.5px] hover:translate-y-[1.5px] hover:shadow-[1.5px_1.5px_0_0_#000] hover:bg-purple-200 active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all duration-150"
                >
                  <div className="flex items-center justify-between">
                    <Badge variant="purple">UNLOCKED</Badge>
                    <Sparkles className="size-3.5 text-purple-800" />
                  </div>
                  <h4 className="font-black text-xs uppercase text-black">{egg.title}</h4>
                  <div className="text-[10px] font-mono text-gray-600 truncate font-bold">{egg.trigger}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 12. Wrapped Recap & Launcher */}
      <div id="section-wrapped" className="border-[4px] border-black bg-[#FFDC58] rounded-[12px] p-6 shadow-[8px_8px_0_0_#000] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 text-black">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Badge variant="coral">ANNUAL RECAP</Badge>
            <h2 className="text-2xl font-black uppercase tracking-tight">
              11. GITOPSY FORENSIC WRAPPED
            </h2>
          </div>
          <p className="text-xs font-bold text-gray-800 max-w-lg leading-relaxed">
            Launch the full-screen 15-chapter audiovisual narrative journey showcasing your headline records,
            primary specimen, and developer diagnosis.
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

        {/* 13. Data Management & Export */}
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

      {/* Easter Egg Modal */}
      {selectedEgg && (
        <EasterEggModal
          egg={selectedEgg as any}
          isOpen={Boolean(selectedEgg)}
          onClose={() => setSelectedEgg(null)}
        />
      )}
    </div>
  );
}
