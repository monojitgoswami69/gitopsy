import Dexie, { type EntityTable } from "dexie";
import { GitopsyAnalysis, AnalysisCheckpoint } from "@/types/domain";

export interface SyncStateEntry {
  repoFullName: string;
  lastCommitSha?: string;
  lastFetchedAt: string;
  isComplete: boolean;
}

export class GitopsyDexieDatabase extends Dexie {
  analyses!: EntityTable<GitopsyAnalysis, "id">;
  syncState!: EntityTable<SyncStateEntry, "repoFullName">;
  checkpoints!: EntityTable<AnalysisCheckpoint, "checkpointId">;

  constructor() {
    super("GitopsyForensicDB");

    this.version(2).stores({
      analyses: "id, generatedAt, isIncremental",
      syncState: "repoFullName, lastFetchedAt",
    });

    this.version(3).stores({
      analyses: "id, generatedAt, isIncremental, subjectLogin",
      syncState: "repoFullName, lastFetchedAt",
    });

    this.version(4).stores({
      analyses: "id, generatedAt, isIncremental, subjectLogin",
      syncState: "repoFullName, lastFetchedAt",
      checkpoints: "checkpointId, subjectLogin, resumeAt",
    });
  }
}

export const gitopsyDb = new GitopsyDexieDatabase();
