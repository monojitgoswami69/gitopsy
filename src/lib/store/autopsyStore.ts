import { create } from "zustand";
import { GitopsyAnalysis } from "@/types/domain";
import { gitopsyDb } from "../db";

interface AutopsyProgressState {
  isAnalyzing: boolean;
  phase: string;
  currentItem: string;
  current: number;
  total: number;
  percentage: number;
  message: string;
  rateLimitWarning: {
    isThrottled: boolean;
    resetAt: string;
    message: string;
  } | null;
}

interface AutopsyStoreState {
  currentAnalysis: GitopsyAnalysis | null;
  previousAnalysis: GitopsyAnalysis | null;
  selectedRepoFullName: string | null;
  activeHeatmapMetric: "COMMITS" | "LINES";
  progress: AutopsyProgressState;
  
  setCurrentAnalysis: (analysis: GitopsyAnalysis) => void;
  setPreviousAnalysis: (analysis: GitopsyAnalysis | null) => void;
  setSelectedRepoFullName: (fullName: string | null) => void;
  setActiveHeatmapMetric: (metric: "COMMITS" | "LINES") => void;
  setProgress: (progress: Partial<AutopsyProgressState>) => void;
  resetProgress: () => void;
  loadLatestSavedAnalysis: () => Promise<GitopsyAnalysis | null>;
}

const initialProgress: AutopsyProgressState = {
  isAnalyzing: false,
  phase: "STANDBY",
  currentItem: "",
  current: 0,
  total: 0,
  percentage: 0,
  message: "Coroner standby. Ready to examine specimen.",
  rateLimitWarning: null,
};

export const useAutopsyStore = create<AutopsyStoreState>((set) => ({
  currentAnalysis: null,
  previousAnalysis: null,
  selectedRepoFullName: null,
  activeHeatmapMetric: "COMMITS",
  progress: initialProgress,

  setCurrentAnalysis: (analysis) => set({ currentAnalysis: analysis }),
  setPreviousAnalysis: (analysis) => set({ previousAnalysis: analysis }),
  setSelectedRepoFullName: (fullName) => set({ selectedRepoFullName: fullName }),
  setActiveHeatmapMetric: (metric) => set({ activeHeatmapMetric: metric }),
  setProgress: (progress) =>
    set((state) => ({ progress: { ...state.progress, ...progress } })),
  resetProgress: () => set({ progress: initialProgress }),

  loadLatestSavedAnalysis: async () => {
    try {
      const latest = await gitopsyDb.analyses.orderBy("generatedAt").reverse().first();
      if (latest) {
        set({ currentAnalysis: latest });
        return latest;
      }
      return null;
    } catch {
      return null;
    }
  },
}));
