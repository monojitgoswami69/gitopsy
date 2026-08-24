"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAutopsyStore } from "@/lib/store/autopsyStore";
import { useAuthStore } from "@/lib/store/authStore";
import { SubjectHeader } from "@/components/forensic/SubjectHeader";
import { AutopsyReportsConsole } from "@/components/forensic/AutopsyReportsConsole";
import { RefreshCw, Lock } from "lucide-react";
import { ForensicWorkerClient } from "@/workers/workerClient";
import { gitopsyDb } from "@/lib/db";

export default function AutopsyConsolePage() {
  const router = useRouter();
  const {
    currentAnalysis,
    setCurrentAnalysis,
    loadLatestSavedAnalysis,
    progress,
    setProgress,
    resetProgress,
  } = useAutopsyStore();
  const { token, checkSession, username, profile, fetchProfile } = useAuthStore();
  const [isLoading, setIsLoading] = useState(!profile && !token);

  useEffect(() => {
    async function init() {
      // 1. Purge legacy demo artifacts from IndexedDB in the background
      try {
        await gitopsyDb.analyses.where("id").startsWith("demo-").delete();
        await gitopsyDb.analyses.where("id").startsWith("specimen-").delete();
      } catch {
        // ignore cleanup error
      }

      // 2. Clean up URL param if needed
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get("auth_status") === "connected") {
        window.history.replaceState({}, "", "/autopsy");
      }

      // 3. Check session only if not already authenticated
      if (!token) {
        await checkSession();
      }

      // 4. Load latest analysis in background
      await loadLatestSavedAnalysis();

      setIsLoading(false);
    }

    init();
  }, []);

  const runLiveExamination = async (authToken: string, targetUsername?: string) => {
    setProgress({
      isAnalyzing: true,
      phase: "INITIALIZING",
      currentItem: "GitHub API",
      current: 0,
      total: 10,
      percentage: 5,
      message: "Connecting to GitHub forensic stream...",
      rateLimitWarning: null,
    });

    const client = new ForensicWorkerClient();
    try {
      const report = await client.startAnalysis(
        { token: authToken, username: targetUsername },
        {
          onProgress: (p) => setProgress({ ...p, isAnalyzing: true }),
          onRateLimit: (r) =>
            setProgress({
              rateLimitWarning: {
                isThrottled: true,
                resetAt: r.resetAt,
                message: r.message,
              },
            }),
        }
      );
      setCurrentAnalysis(report);
      await gitopsyDb.analyses.put(report);
      resetProgress();
      // Redirect to the newly generated report
      router.push(`/autopsy/${report.id}`);
      return report;
    } catch (err) {
      alert(`Forensic examination error: ${err}`);
      resetProgress();
      return null;
    }
  };

  const handleStartOrReExamine = async () => {
    let activeToken = token;
    if (!activeToken) {
      activeToken = await checkSession();
    }
    if (!activeToken) {
      window.location.href = "/api/auth/login";
      return;
    }
    await runLiveExamination(activeToken, username || profile?.login || undefined);
  };

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-140px)] flex flex-col items-center justify-center text-center max-w-xl mx-auto gap-3 text-black px-4">
        <div className="relative size-10 flex items-center justify-center mb-1">
          <RefreshCw className="size-7 animate-spin text-black stroke-[2.5]" />
        </div>
        <div className="flex flex-col gap-1">
          <span className="font-mono text-xs sm:text-sm font-black tracking-widest uppercase text-black">
            INITIALIZING FORENSIC ENVIRONMENT...
          </span>
          <span className="text-[11px] sm:text-xs font-semibold text-gray-600 font-mono">
            Establishing local sandbox and session pipelines
          </span>
        </div>
      </div>
    );
  }

  const activeSubject = profile || currentAnalysis?.subject;

  if (!activeSubject) {
    return (
      <div className="min-h-[calc(100vh-140px)] flex flex-col items-center justify-center text-center max-w-3xl mx-auto gap-6 text-black px-4 -mt-4">
        <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight leading-tight">
          Authentication Required
        </h1>

        <p className="text-sm sm:text-base font-semibold text-gray-800 max-w-xl leading-relaxed">
          Connect your GitHub account via PKCE to audit your version control history, commit genetics, and developer classifications.
        </p>

        <div className="flex items-center gap-4 mt-1">
          <Link
            href="/api/auth/login"
            className="bg-[#FFDC58] text-black border-[3px] border-black px-8 py-4 text-sm font-black uppercase shadow-[6px_6px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0_0_#000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all flex items-center gap-2.5 rounded-2xl"
          >
            <Lock className="size-5" />
            <span>Connect GitHub (PKCE)</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col gap-8 max-w-6xl mx-auto pb-16 pt-2">
      {/* 01. Subject Profile Header (Rendered directly on page with profile content only) */}
      <SubjectHeader
        subject={activeSubject}
      />

      {/* Divider Line between Profile and Reports Console */}
      <div className="w-full h-[2.5px] bg-black/80 my-1" />

      {/* 02. Available Autopsy Reports Console (Rendered directly on page) */}
      <AutopsyReportsConsole
        currentAnalysisId={currentAnalysis?.id}
        onSelectAnalysis={(selected) => setCurrentAnalysis(selected)}
        onRunNewAnalysis={handleStartOrReExamine}
        isAnalyzing={progress.isAnalyzing}
      />
    </div>
  );
}
