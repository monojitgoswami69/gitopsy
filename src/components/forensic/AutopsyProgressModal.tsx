"use client";

import React, { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Skull, AlertTriangle, Terminal, OctagonAlert, Save, Play } from "lucide-react";

interface RateLimitWarning {
  isThrottled: boolean;
  resetAt: string;
  message: string;
  isTerminal: boolean;
}

interface RepoWarning {
  repoFullName: string;
  phase: string;
  error: string;
}

interface ResumeState {
  checkpointId: string;
  resumeAt: string;
  resumeReason: string;
  resetEpoch: number;
}

interface CheckpointInfo {
  checkpointId: string;
  reposProcessed: number;
  reposTotal: number;
}

function formatCountdown(seconds: number): string {
  if (seconds <= 0) return "Ready to resume";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export function AutopsyProgressModal({
  isOpen,
  phase,
  currentItem,
  current,
  total,
  percentage,
  message,
  rateLimitWarning,
  repoWarnings,
  checkpointInfo,
  resumeState,
  onResume,
}: {
  isOpen: boolean;
  phase: string;
  currentItem?: string;
  current: number;
  total: number;
  percentage: number;
  message: string;
  rateLimitWarning?: RateLimitWarning | null;
  repoWarnings?: RepoWarning[];
  checkpointInfo?: CheckpointInfo | null;
  resumeState?: ResumeState | null;
  onResume?: () => void;
}) {
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (!resumeState) {
      setCountdown(0);
      return;
    }
    const update = () => {
      const now = Math.floor(Date.now() / 1000);
      const remaining = resumeState.resetEpoch - now;
      setCountdown(Math.max(0, remaining));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [resumeState]);

  if (!isOpen && !resumeState) return null;

  const visibleRepoWarnings = (repoWarnings || []).slice(-5);
  const showResume = resumeState !== null;
  const canResume = countdown <= 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/35 backdrop-blur-[6px] animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-[#FFFDF9] border-[4px] border-black rounded-[16px] p-6 sm:p-7 shadow-[10px_10px_0_0_#000] text-black flex flex-col gap-5 relative max-h-[90vh] overflow-y-auto">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between border-b-[3px] border-black pb-3.5">
          <div className="flex items-center gap-2.5">
            <Skull className="size-6 text-black" />
            <h2 className="text-lg sm:text-xl font-black uppercase tracking-tight">
              {showResume ? "Analysis Paused for Rate Limit" : "Forensic Autopsy In Progress"}
            </h2>
          </div>
          <Badge variant={showResume ? "coral" : "cyan"} className="font-mono text-xs px-2.5 py-1">
            {phase || "ANALYZING"}
          </Badge>
        </div>

        {/* Resume Banner */}
        {showResume && (
          <div className="border-[3px] border-amber-500 bg-amber-50 rounded-[12px] p-5 shadow-[4px_4px_0_0_#000] flex flex-col gap-4">
            <div className="flex items-start gap-3">
              <Save className="size-6 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-black text-sm uppercase text-amber-900 mb-1">
                  Checkpoint Saved — Resume Available
                </h3>
                <p className="text-xs font-mono font-bold text-amber-800 leading-relaxed">
                  {resumeState!.resumeReason}
                </p>
                {checkpointInfo && (
                  <p className="text-xs font-mono text-amber-700 mt-1">
                    Progress: {checkpointInfo.reposProcessed}/{checkpointInfo.reposTotal} repos processed.
                    Remaining repos will be fetched on resume.
                  </p>
                )}
              </div>
            </div>

            {/* Countdown Timer */}
            <div className="flex items-center justify-between bg-white border-[2px] border-amber-400 rounded-[8px] p-3">
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase text-gray-500">
                  {canResume ? "READY TO RESUME" : "RESUME AVAILABLE IN"}
                </span>
                <span className="text-2xl font-black font-mono text-amber-700">
                  {formatCountdown(countdown)}
                </span>
                <span className="text-[10px] font-mono text-gray-500">
                  Reset at: {new Date(resumeState!.resetEpoch * 1000).toLocaleString()}
                </span>
              </div>
              <button
                onClick={onResume}
                disabled={!canResume || !onResume}
                className={`px-5 py-3 rounded-xl border-[2.5px] border-black font-black text-xs uppercase flex items-center gap-2 shadow-[3px_3px_0_0_#000] transition-all ${
                  canResume && onResume
                    ? "bg-[#FFDC58] hover:bg-[#FD9745] hover:translate-x-[1.5px] hover:translate-y-[1.5px] hover:shadow-[1.5px_1.5px_0_0_#000] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none cursor-pointer"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }`}
              >
                <Play className="size-4" />
                {canResume ? "RESUME NOW" : "WAITING..."}
              </button>
            </div>
          </div>
        )}

        {/* Coroner Dispatch Box (only when not in resume state) */}
        {!showResume && (
          <div className="bg-white border-[3px] border-black p-4 rounded-[12px] shadow-[3px_3px_0_0_#000] flex flex-col gap-2">
            <div className="flex items-center justify-between text-[10px] font-mono text-gray-600 border-b-2 border-black/10 pb-1.5 font-bold">
              <span className="flex items-center gap-1.5 text-black">
                <Terminal className="size-3 text-black" />
                <span>CORONER DISPATCH TELEMETRY</span>
              </span>
              <span className="text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded border border-black/20">
                STREAM LIVE
              </span>
            </div>
            <p className="text-xs sm:text-sm font-mono font-black text-black leading-snug">
              &ldquo;{message || "Processing version control artifacts..."}&rdquo;
            </p>
            {currentItem && (
              <p className="text-[10px] font-mono text-gray-500 font-bold uppercase tracking-wider">
                TARGET: {currentItem}
              </p>
            )}
          </div>
        )}

        {/* Progress Bar (only when not in resume state) */}
        {!showResume && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs font-mono font-bold">
              <span className="text-gray-700 uppercase">SCAN PROGRESS</span>
              <span className="text-black">
                <strong className="font-black text-sm">{current}</strong> / {total} SPECIMENS ({percentage}%)
              </span>
            </div>
            <div className="h-6 w-full border-[3px] border-black rounded-xl overflow-hidden bg-white shadow-[2px_2px_0_0_#000] relative">
              <div
                className="h-full bg-[#FFDC58] transition-all duration-200 border-r-2 border-black"
                style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
              />
              <div className="absolute inset-0 flex items-center justify-center font-mono text-[11px] font-black text-black select-none pointer-events-none">
                {percentage}%
              </div>
            </div>
          </div>
        )}

        {/* Rate limit warning */}
        {rateLimitWarning && !showResume && (
          <div
            className={`border-[2px] border-black p-3 rounded-[8px] text-white flex items-start gap-2.5 text-xs font-bold shadow-[3px_3px_0_0_#000] ${
              rateLimitWarning.isTerminal ? "bg-red-700" : "bg-[#FF6B6B]"
            }`}
          >
            {rateLimitWarning.isTerminal ? (
              <OctagonAlert className="size-4 shrink-0 text-white mt-0.5" />
            ) : (
              <AlertTriangle className="size-4 shrink-0 text-white mt-0.5" />
            )}
            <div>
              <div className="font-black uppercase">
                {rateLimitWarning.isTerminal
                  ? "GitHub API Rate Limit Exhausted"
                  : "GitHub API Rate Limit Soft Throttling"}
              </div>
              <div className="text-[11px] font-mono opacity-95 mt-0.5 font-normal">
                {rateLimitWarning.message}
                {!rateLimitWarning.isTerminal && ` (Auto-resuming at ${rateLimitWarning.resetAt})`}
              </div>
            </div>
          </div>
        )}

        {/* Repo failure warnings */}
        {visibleRepoWarnings.length > 0 && !showResume && (
          <div className="border-[2px] border-amber-500 bg-amber-50 p-3 rounded-[8px] flex items-start gap-2.5 text-xs shadow-[3px_3px_0_0_#000]">
            <AlertTriangle className="size-4 shrink-0 text-amber-600 mt-0.5" />
            <div className="flex-1 flex flex-col gap-1">
              <div className="font-black uppercase text-amber-800">
                {visibleRepoWarnings.length} Repository
                {visibleRepoWarnings.length === 1 ? "" : "s"} with Fetch Issues
              </div>
              {visibleRepoWarnings.map((w, i) => (
                <div key={i} className="text-[10px] font-mono text-amber-700 font-semibold">
                  {w.repoFullName} ({w.phase}): {w.error}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

