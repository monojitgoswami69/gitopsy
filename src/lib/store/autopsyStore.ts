import { create } from "zustand";
import { GitopsyAnalysis, AnalysisCheckpoint } from "@/types/domain";
import { gitopsyDb } from "../db";

interface AutopsyProgressState {
  isAnalyzing: boolean;
  phase: string;
  currentItem: string;
  current: number;
  total: number;
  percentage: number;
  message: string;
  rateLimitRemaining?: number;
  rateLimitWarning: {
    isThrottled: boolean;
    resetAt: string;
    message: string;
    isTerminal: boolean;
  } | null;
  repoWarnings: { repoFullName: string; phase: string; error: string }[];
  logs: { level: "info" | "warn" | "error"; message: string; timestamp: number }[];
  checkpointInfo: {
    checkpointId: string;
    reposProcessed: number;
    reposTotal: number;
  } | null;
}

interface ResumeAvailableState {
  checkpointId: string;
  resumeAt: string;
  resumeReason: string;
  resetEpoch: number;
}

interface AutopsyStoreState {
  currentAnalysis: GitopsyAnalysis | null;
  previousAnalysis: GitopsyAnalysis | null;
  selectedRepoFullName: string | null;
  activeHeatmapMetric: "COMMITS" | "LINES";
  progress: AutopsyProgressState;
  loadError: string | null;
  resumeState: ResumeAvailableState | null;
  activeCheckpoint: AnalysisCheckpoint | null;

  setCurrentAnalysis: (analysis: GitopsyAnalysis) => void;
  setPreviousAnalysis: (analysis: GitopsyAnalysis | null) => void;
  setSelectedRepoFullName: (fullName: string | null) => void;
  setActiveHeatmapMetric: (metric: "COMMITS" | "LINES") => void;
  setProgress: (progress: Partial<AutopsyProgressState>) => void;
  addRepoWarning: (warning: { repoFullName: string; phase: string; error: string }) => void;
  addLog: (log: { level: "info" | "warn" | "error"; message: string }) => void;
  setCheckpointInfo: (info: { checkpointId: string; reposProcessed: number; reposTotal: number } | null) => void;
  setResumeState: (state: ResumeAvailableState | null) => void;
  setActiveCheckpoint: (checkpoint: AnalysisCheckpoint | null) => void;
  loadExistingCheckpoint: () => Promise<AnalysisCheckpoint | null>;
  resetProgress: () => void;
  loadLatestSavedAnalysis: () => Promise<GitopsyAnalysis | null>;
  clearLoadError: () => void;
}

const initialProgress: AutopsyProgressState = {
  isAnalyzing: false,
  phase: "STANDBY",
  currentItem: "",
  current: 0,
  total: 0,
  percentage: 0,
  message: "Coroner standby. Ready to examine specimen.",
  rateLimitRemaining: undefined,
  rateLimitWarning: null,
  repoWarnings: [],
  logs: [],
  checkpointInfo: null,
};

export const useAutopsyStore = create<AutopsyStoreState>((set) => ({
  currentAnalysis: null,
  previousAnalysis: null,
  selectedRepoFullName: null,
  activeHeatmapMetric: "COMMITS",
  progress: initialProgress,
  loadError: null,
  resumeState: null,
  activeCheckpoint: null,

  setCurrentAnalysis: (analysis) => set({ currentAnalysis: analysis }),
  setPreviousAnalysis: (analysis) => set({ previousAnalysis: analysis }),
  setSelectedRepoFullName: (fullName) => set({ selectedRepoFullName: fullName }),
  setActiveHeatmapMetric: (metric) => set({ activeHeatmapMetric: metric }),
  setProgress: (progress) =>
    set((state) => ({ progress: { ...state.progress, ...progress } })),
  addRepoWarning: (warning) =>
    set((state) => ({
      progress: {
        ...state.progress,
        // Capped alongside logs: the modal only renders the last 5 anyway.
        repoWarnings: [...state.progress.repoWarnings.slice(-199), warning],
      },
    })),
  addLog: (log) =>
    set((state) => ({
      progress: {
        ...state.progress,
        // Capped: logs are diagnostic-only (no UI consumes them yet); an
        // unbounded array re-renders the app on every worker log line and
        // grows with repo count.
        logs: [
          ...state.progress.logs.slice(-199),
          { ...log, timestamp: Date.now() },
        ],
      },
    })),
  setCheckpointInfo: (info) =>
    set((state) => ({ progress: { ...state.progress, checkpointInfo: info } })),
  setResumeState: (resumeState) => set({ resumeState }),
  setActiveCheckpoint: (checkpoint) => set({ activeCheckpoint: checkpoint }),
  loadExistingCheckpoint: async () => {
    try {
      const checkpoint = await gitopsyDb.checkpoints.orderBy("resumeAt").reverse().first();
      if (checkpoint) {
        set({ activeCheckpoint: checkpoint, resumeState: {
          checkpointId: checkpoint.checkpointId,
          resumeAt: checkpoint.resumeAt,
          resumeReason: checkpoint.resumeReason,
          resetEpoch: checkpoint.rateLimitResetEpoch,
        } });
        return checkpoint;
      }
      return null;
    } catch {
      return null;
    }
  },
  resetProgress: () => set({ progress: initialProgress }),

  loadLatestSavedAnalysis: async () => {
    try {
      const latest = await gitopsyDb.analyses.orderBy("generatedAt").reverse().first();
      if (latest) {
        set({ currentAnalysis: latest, loadError: null });
        return latest;
      }
      set({ loadError: null });
      return null;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      set({ loadError: `Failed to load saved analysis: ${message}` });
      return null;
    }
  },

  clearLoadError: () => set({ loadError: null }),
}));

