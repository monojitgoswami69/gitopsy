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
    <div className="w-full flex flex-col gap-3.5 text-black">
      {/* Console Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight">
            Autopsy Reports Console
          </h2>
          <p className="text-xs text-gray-600 font-bold">
            Stored forensic examinations in your local browser sandbox
          </p>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-xs font-mono font-bold text-gray-600 uppercase tracking-wider hidden sm:inline">
            {reports.length} {reports.length === 1 ? "REPORT" : "REPORTS"} STORED
          </span>

          <Button
            size="sm"
            variant="main"
            onClick={onRunNewAnalysis}
            disabled={isAnalyzing}
            className="font-black text-xs gap-1.5"
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
                className="group border-[3px] border-black bg-white p-5 rounded-2xl shadow-[4px_4px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#000] transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Left: Specimen Details & Meta */}
                <div className="flex items-start sm:items-center gap-4">
                  <div className="relative size-12 shrink-0 rounded-xl border-2 border-black overflow-hidden bg-[#FFDC58] hidden sm:block">
                    <img
                      src={r.subject.avatarUrl || `https://github.com/${r.subject.login}.png`}
                      alt={r.subject.login}
                      className="size-full object-cover"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm sm:text-base font-black uppercase text-black">
                        {r.subject.name || r.subject.login}
                      </span>
                      <span className="text-xs font-mono font-bold text-gray-600">
                        {r.subject.login}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs font-semibold text-gray-600 flex-wrap">
                      <span className="flex items-center gap-1 font-mono">
                        <Clock className="size-3 text-gray-500" />
                        {examinedDate}
                      </span>
                      <span>•</span>
                      <span>
                        <strong className="text-black font-mono">
                          {r.summary.totalCommits.toLocaleString()}
                        </strong>{" "}
                        Commits
                      </span>
                      <span>•</span>
                      <span>
                        <strong className="text-black font-mono">
                          {r.summary.reposAnalyzed}
                        </strong>{" "}
                        Repositories
                      </span>
                      {r.languages[0]?.name && (
                        <>
                          <span>•</span>
                          <span>{r.languages[0].name}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-3 self-end md:self-center">
                  <Link
                    href={`/autopsy/${r.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-[#FFDC58] hover:bg-[#ffe27a] text-black border-[2.5px] border-black px-4 py-2 rounded-xl text-xs font-black uppercase flex items-center gap-1.5 shadow-[3px_3px_0_0_#000] hover:translate-x-[1.5px] hover:translate-y-[1.5px] hover:shadow-[1.5px_1.5px_0_0_#000] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all duration-75 select-none"
                  >
                    <span>VIEW REPORT</span>
                    <ArrowRight className="size-3.5" />
                  </Link>

                  <button
                    onClick={(e) => handleDelete(r.id, e)}
                    title="Delete record"
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg border border-transparent hover:border-black transition-all cursor-pointer"
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
