"use client";

import { useAutopsyStore } from "@/lib/store/autopsyStore";
import { useAuthStore } from "@/lib/store/authStore";
import { AutopsyProgressModal } from "@/components/forensic/AutopsyProgressModal";
import { ForensicWorkerClient } from "@/workers/workerClient";

const workerClient = new ForensicWorkerClient();

export function GlobalAutopsyModal() {
  const {
    progress,
    resumeState,
    setResumeState,
    setActiveCheckpoint,
    setProgress,
    addRepoWarning,
    addLog,
    setCheckpointInfo,
    setCurrentAnalysis,
    resetProgress,
  } = useAutopsyStore();
  const { token, checkSession } = useAuthStore();

  const handleResume = async () => {
    const checkpoint = useAutopsyStore.getState().activeCheckpoint;
    if (!checkpoint) return;

    let activeToken = token;
    if (!activeToken) {
      activeToken = await checkSession();
    }
    if (!activeToken) {
      window.location.href = "/api/auth/login?return_to=/autopsy";
      return;
    }

    setResumeState(null);
    setProgress({
      isAnalyzing: true,
      phase: "RESUMING",
      message: `Resuming from checkpoint: ${checkpoint.processedRepoFullNames.length}/${checkpoint.reposToScan.length} repos already processed...`,
      rateLimitWarning: null,
      repoWarnings: [],
      logs: [],
      checkpointInfo: null,
    });

    try {
      const report = await workerClient.resumeAnalysis(
        { token: activeToken, checkpoint },
        {
          onProgress: (p) => setProgress({ ...p, isAnalyzing: true }),
          onRateLimit: (r) =>
            setProgress({
              rateLimitWarning: {
                isThrottled: true,
                resetAt: r.resetAt,
                message: r.message,
                isTerminal: r.isTerminal,
              },
            }),
          onRepoWarning: (w) => addRepoWarning(w),
          onLog: (log) => addLog(log),
          onCheckpointSaved: (info) => setCheckpointInfo(info),
          onResumeAvailable: (resume) => {
            setResumeState(resume);
            useAutopsyStore.getState().loadExistingCheckpoint();
          },
        }
      );

      if (report) {
        setCurrentAnalysis(report);
        try {
          const { gitopsyDb } = await import("@/lib/db");
          await gitopsyDb.analyses.put(report);
        } catch {
          // best-effort
        }
        setActiveCheckpoint(null);
        resetProgress();
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      setProgress({
        phase: "ERROR",
        message: `Resume failed: ${errMsg}`,
        isAnalyzing: false,
      });
    }
  };

  if (!progress.isAnalyzing && !resumeState) {
    return null;
  }

  return (
    <AutopsyProgressModal
      {...progress}
      isOpen={progress.isAnalyzing}
      resumeState={resumeState}
      onResume={handleResume}
    />
  );
}
