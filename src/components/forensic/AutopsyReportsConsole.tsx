"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GitopsyAnalysis } from "@/types/domain";
import { gitopsyDb } from "@/lib/db";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Zap,
  Trash2,
  Clock,
  Plus,
  ArrowRight,
} from "lucide-react";

interface AutopsyReportsConsoleProps {
  currentAnalysisId?: string;
  onSelectAnalysis?: (analysis: GitopsyAnalysis) => void;
  onRunNewAnalysis: () => void;
  isAnalyzing: boolean;
}

export function AutopsyReportsConsole({
  currentAnalysisId,
  onSelectAnalysis,
  onRunNewAnalysis,
  isAnalyzing,
}: AutopsyReportsConsoleProps) {
  const router = useRouter();
  const [reports, setReports] = useState<GitopsyAnalysis[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadReports = async () => {
    try {
      const all = await gitopsyDb.analyses
        .filter((a) => !a.id.startsWith("demo-") && !a.id.startsWith("specimen-"))
        .toArray();
      all.sort(
        (a, b) =>
          new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime()
      );
      setReports(all);
      setLoadError(null);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, [currentAnalysisId, isAnalyzing]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this autopsy record?")) {
      return;
    }
    await gitopsyDb.analyses.delete(id);
    await loadReports();
  };

  const handleOpenReport = (r: GitopsyAnalysis) => {
    if (onSelectAnalysis) {
      onSelectAnalysis(r);
    }
    router.push(`/autopsy/${r.id}`);
  };

  return (
    <div className="w-full flex flex-col gap-4 text-black">
      {/* Console Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-1">
        <div>
          <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight">
            Autopsy Reports Console
          </h2>
          <p className="text-xs text-gray-600 font-bold mt-0.5">
            Stored forensic examinations in your local browser sandbox
          </p>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
          <span className="text-[11px] sm:text-xs font-mono font-bold text-gray-600 uppercase tracking-wider">
            {reports.length} {reports.length === 1 ? "REPORT" : "REPORTS"} STORED
          </span>

          <Button
            size="sm"
            variant="main"
            onClick={onRunNewAnalysis}
            disabled={isAnalyzing}
            className="font-black text-xs gap-1.5 shadow-[3px_3px_0_0_#000]"
          >
            <Plus className="size-4 stroke-[3]" />
            <span>RUN NEW AUTOPSY</span>
          </Button>
        </div>
      </div>

      {/* Reports Roster List */}
      {isLoading ? (
        <div className="text-center py-6 font-mono text-xs text-gray-500">
          Scanning local database records...
        </div>
      ) : loadError ? (
        <div className="text-center py-10 border-2 border-dashed border-red-400 rounded-2xl bg-red-50 flex flex-col items-center gap-3">
          <FileText className="size-8 text-red-400" />
          <div className="text-sm font-bold text-red-700">
            Failed to load autopsy reports.
          </div>
          <div className="text-xs font-mono text-red-500 max-w-md break-words">
            {loadError}
          </div>
          <Button size="sm" variant="main" onClick={loadReports}>
            <Zap className="size-4" /> Retry Load
          </Button>
        </div>
      ) : reports.length === 0 ? (
        <div className="text-center py-10 border-2 border-dashed border-black/30 rounded-2xl bg-amber-50/40 flex flex-col items-center gap-3">
          <FileText className="size-8 text-gray-400" />
          <div className="text-sm font-bold text-gray-700">
            No saved autopsy reports yet.
          </div>
          <Button
            size="sm"
            variant="main"
            onClick={onRunNewAnalysis}
            disabled={isAnalyzing}
          >
            <Zap className="size-4" /> Run Your First Autopsy
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3.5">
          {reports.map((r) => {
            const examinedDate = new Date(r.generatedAt).toLocaleString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
              hour: "numeric",
              minute: "2-digit",
              hour12: true,
            });

            return (
              <div
                key={r.id}
                onClick={() => handleOpenReport(r)}
                className="group border-[3px] border-black bg-white p-4 sm:p-5 rounded-2xl shadow-[4px_4px_0_0_#000] hover:translate-x-[1.5px] hover:translate-y-[1.5px] hover:shadow-[2.5px_2.5px_0_0_#000] transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-3.5 sm:gap-4"
              >
                {/* Left: Specimen Details & Meta */}
                <div className="flex items-start sm:items-center gap-3.5 sm:gap-4 min-w-0">
                  <div className="relative size-12 sm:size-14 shrink-0 rounded-xl border-2 border-black overflow-hidden bg-[#FFDC58]">
                    <img
                      src={r.subject.avatarUrl || `https://github.com/${r.subject.login}.png`}
                      alt={r.subject.login}
                      className="size-full object-cover"
                    />
                  </div>

                  <div className="flex flex-col gap-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm sm:text-base font-black uppercase text-black truncate max-w-[200px] xs:max-w-xs sm:max-w-none">
                        {r.subject.name || r.subject.login}
                      </span>
                      <span className="text-[11px] sm:text-xs font-mono font-bold text-gray-700 bg-amber-100/80 px-2 py-0.5 rounded border border-black/20">
                        {r.subject.login}
                      </span>
                    </div>

                    <div className="flex items-center gap-x-2.5 gap-y-1 text-xs font-semibold text-gray-600 flex-wrap mt-0.5">
                      <span className="flex items-center gap-1 font-mono text-[11px] sm:text-xs text-gray-700">
                        <Clock className="size-3 text-gray-500 shrink-0" />
                        {examinedDate}
                      </span>
                      <span className="text-gray-300 hidden xs:inline">•</span>
                      <span className="text-[11px] sm:text-xs">
                        <strong className="text-black font-mono font-bold">
                          {r.summary.totalCommits.toLocaleString()}
                        </strong>{" "}
                        Commits
                      </span>
                      <span className="text-gray-300 hidden xs:inline">•</span>
                      <span className="text-[11px] sm:text-xs">
                        <strong className="text-black font-mono font-bold">
                          {r.summary.reposAnalyzed}
                        </strong>{" "}
                        Repositories
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right / Bottom: Actions */}
                <div className="flex items-center justify-between md:justify-end gap-2.5 pt-3 md:pt-0 border-t border-black/10 md:border-t-0 shrink-0">
                  <Link
                    href={`/autopsy/${r.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="flex-1 md:flex-initial bg-[#FFDC58] hover:bg-[#ffe27a] text-black border-[2px] border-black px-4 py-2.5 rounded-[8px] text-xs font-black uppercase flex items-center justify-center gap-1.5 shadow-[2px_2px_0_0_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0_0_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all duration-75 select-none"
                  >
                    <span>VIEW REPORT</span>
                    <ArrowRight className="size-3.5" />
                  </Link>

                  <button
                    onClick={(e) => handleDelete(r.id, e)}
                    title="Delete record"
                    className="p-2.5 text-black hover:text-white bg-white hover:bg-red-500 rounded-[8px] border-[2px] border-black shadow-[2px_2px_0_0_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0_0_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer shrink-0"
                    aria-label="Delete autopsy record"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
