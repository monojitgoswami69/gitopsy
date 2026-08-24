"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Skull, AlertTriangle, Terminal } from "lucide-react";

export function AutopsyProgressModal({
  isOpen,
  phase,
  currentItem,
  current,
  total,
  percentage,
  message,
  rateLimitWarning,
}: {
  isOpen: boolean;
  phase: string;
  currentItem: string;
  current: number;
  total: number;
  percentage: number;
  message: string;
  rateLimitWarning?: {
    isThrottled: boolean;
    resetAt: string;
    message: string;
  } | null;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/35 backdrop-blur-[6px] animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-[#FFFDF9] border-[4px] border-black rounded-[16px] p-6 sm:p-7 shadow-[10px_10px_0_0_#000] text-black flex flex-col gap-5 relative">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between border-b-[3px] border-black pb-3.5">
          <div className="flex items-center gap-2.5">
            <Skull className="size-6 text-black" />
            <h2 className="text-lg sm:text-xl font-black uppercase tracking-tight">
              Forensic Autopsy In Progress
            </h2>
          </div>

          <Badge variant="coral" className="font-mono text-xs px-2.5 py-1">
            {phase || "ANALYZING"}
          </Badge>
        </div>

        {/* Coroner Dispatch Box (Light Forensic Theme) */}
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
        </div>

        {/* Specimen Counter & Progress Bar */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs font-mono font-bold">
            <span className="text-gray-700 uppercase">
              SCAN PROGRESS
            </span>
            <span className="text-black">
              <strong className="font-black text-sm">{current}</strong> / {total} SPECIMENS ({percentage}%)
            </span>
          </div>

          {/* Styled Neobrutalist Progress Bar */}
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

        {/* Rate limit warning if GitHub requests throttling */}
        {rateLimitWarning && (
          <div className="border-[2px] border-black bg-[#FF6B6B] p-3 rounded-[8px] text-white flex items-start gap-2.5 text-xs font-bold shadow-[3px_3px_0_0_#000]">
            <AlertTriangle className="size-4 shrink-0 text-white mt-0.5" />
            <div>
              <div className="font-black uppercase">GitHub API Rate Limit Soft Throttling</div>
              <div className="text-[11px] font-mono opacity-95 mt-0.5 font-normal">
                {rateLimitWarning.message} (Auto-resuming at {rateLimitWarning.resetAt})
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
