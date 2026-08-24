import { gitopsyDb } from "./index";
import { GitopsyAnalysis } from "@/types/domain";
import { z } from "zod";

const GitopsyAnalysisImportSchema = z.object({
  id: z.string(),
  generatedAt: z.string(),
  isIncremental: z.boolean(),
  durationMs: z.number(),
  subject: z.object({
    login: z.string(),
    name: z.string().nullable().optional(),
    avatarUrl: z.string(),
    bio: z.string().nullable().optional(),
    company: z.string().nullable().optional(),
    location: z.string().nullable().optional(),
    createdAt: z.string(),
    publicRepos: z.number(),
    totalPrivateRepos: z.number().default(0),
    followers: z.number().default(0),
    following: z.number().default(0),
  }),
  summary: z.object({
    totalCommits: z.number(),
    reposAnalyzed: z.number(),
    activeRepos: z.number(),
    linesAdded: z.number(),
    linesDeleted: z.number(),
    netLines: z.number(),
    prsAuthored: z.number(),
    prsMerged: z.number(),
    mergeRatePercentage: z.number(),
    issuesAuthored: z.number(),
    reviewsAuthored: z.number(),
    starsReceived: z.number(),
    forksReceived: z.number(),
    longestStreakDays: z.number(),
    activeStreakDays: z.number(),
    totalActiveDays: z.number(),
    busiestHour: z.number(),
    busiestWeekday: z.string(),
    busiestMonth: z.string(),
    nightCommitPercentage: z.number(),
    weekendCommitPercentage: z.number(),
  }),
  activity: z.object({
    heatmapCalendar: z.array(z.any()),
    byHour: z.array(z.number()),
    byWeekday: z.array(z.number()),
    byMonth: z.array(z.any()),
  }),
  repositories: z.array(z.any()),
  languages: z.array(z.any()),
  commitForensics: z.object({
    totalAnalyzed: z.number(),
    averageAdditionsPerCommit: z.number(),
    averageDeletionsPerCommit: z.number(),
    medianCommitSize: z.number(),
    churnRatio: z.number(),
    sizeDistribution: z.any(),
    messageCategories: z.array(z.any()),
    shortMessageCount: z.number(),
    repeatedMessageCount: z.number(),
    conventionalCommitCount: z.number(),
    largestCommit: z.any().nullable().optional(),
  }),
  classifications: z.array(z.any()),
  primaryClassification: z.any(),
  awards: z.array(z.any()),
  courtCharges: z.array(z.any()),
  findings: z.array(z.any()),
  easterEggs: z.array(z.any()),
});

export class ForensicDataSanitizer {
  /**
   * Deep sanitizes any object to guarantee no tokens, secrets, or authorization data leak.
   */
  public static sanitizeExportData<T>(data: T): T {
    const raw = JSON.stringify(data, (key, value) => {
      const lower = key.toLowerCase();
      if (
        lower.includes("token") ||
        lower.includes("secret") ||
        lower.includes("password") ||
        lower.includes("verifier") ||
        lower.includes("auth") ||
        lower.includes("bearer")
      ) {
        return undefined; // Redact completely
      }
      return value;
    });

    return JSON.parse(raw);
  }

  public static async exportFullAutopsyJson(analysisId?: string): Promise<string> {
    const report = analysisId
      ? await gitopsyDb.analyses.get(analysisId)
      : await gitopsyDb.analyses.orderBy("generatedAt").reverse().first();

    if (!report) {
      throw new Error("No autopsy examination found to export.");
    }

    const sanitized = this.sanitizeExportData(report);
    return JSON.stringify(sanitized, null, 2);
  }

  public static async importAutopsyJson(rawJson: string): Promise<GitopsyAnalysis> {
    try {
      const parsed = JSON.parse(rawJson);
      const validated = GitopsyAnalysisImportSchema.parse(parsed) as unknown as GitopsyAnalysis;

      const sanitized = this.sanitizeExportData(validated);
      await gitopsyDb.analyses.put(sanitized);

      return sanitized;
    } catch (err) {
      throw new Error(`Failed to parse and validate autopsy file: ${err}`);
    }
  }

  public static async purgeAllForensicData(): Promise<void> {
    await gitopsyDb.analyses.clear();
    await gitopsyDb.syncState.clear();
  }
}
