import Dexie, { type EntityTable } from "dexie";
import { GitopsyAnalysis } from "@/types/domain";

export interface SyncStateEntry {
  repoFullName: string;
  lastCommitSha?: string;
  lastFetchedAt: string;
  isComplete: boolean;
}

export class GitopsyDexieDatabase extends Dexie {
  analyses!: EntityTable<GitopsyAnalysis, "id">;
  syncState!: EntityTable<SyncStateEntry, "repoFullName">;

  constructor() {
    super("GitopsyForensicDB");

    this.version(2).stores({
      analyses: "id, generatedAt, isIncremental",
      syncState: "repoFullName, lastFetchedAt",
    });
  }
}

export const gitopsyDb = new GitopsyDexieDatabase();
