import { gitopsyDb } from "./index";
import { GitopsyAnalysis } from "@/types/domain";
import { z } from "zod";

const SizeDistributionSchema = z.object({
  tiny: z.number(),
  small: z.number(),
  medium: z.number(),
  large: z.number(),
  monster: z.number(),
});

const CommitMessageCategorySchema = z.object({
  category: z.string(),
  count: z.number(),
  percentage: z.number(),
});

const CommitRemarkSchema = z.object({
  sha: z.string(),
  repoFullName: z.string(),
  authorDate: z.string(),
  message: z.string(),
  remarkTitle: z.string(),
  remarkText: z.string(),
  type: z.enum(["WIP", "FIX_SPAM", "MINIMALIST", "NOVELIST", "MEGA_DIFF", "NOCTURNAL", "CONVENTIONAL"]),
});

const CommitForensicsSchema = z.object({
  totalAnalyzed: z.number(),
  detailedCommitsCount: z.number().default(0),
  averageAdditionsPerCommit: z.number(),
  averageDeletionsPerCommit: z.number(),
  medianCommitSize: z.number(),
  averageMessageLength: z.number().optional(),
  churnRatio: z.number(),
  sizeDistribution: SizeDistributionSchema,
  messageCategories: z.array(CommitMessageCategorySchema),
  shortMessageCount: z.number(),
  longMessageCount: z.number().optional(),
  repeatedMessageCount: z.number(),
  conventionalCommitCount: z.number(),
  remarks: z.array(CommitRemarkSchema).default([]),
  largestCommit: z
    .object({
      sha: z.string(),
      repoFullName: z.string(),
      message: z.string(),
      additions: z.number(),
      deletions: z.number(),
      filesChanged: z.number(),
      authorDate: z.string().optional(),
    })
    .nullable(),
  topVolumeCommits: z
    .array(
      z.object({
        sha: z.string(),
        repoFullName: z.string(),
        message: z.string(),
        additions: z.number(),
        deletions: z.number(),
        filesChanged: z.number(),
        authorDate: z.string().optional(),
      })
    )
    .optional(),
});

const SubjectProfileSchema = z.object({
  login: z.string(),
  name: z.string().nullable().optional(),
  avatarUrl: z.string(),
  bio: z.string().nullable().optional(),
  company: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  createdAt: z.string(),
  publicRepos: z.number(),
  totalPrivateRepos: z.number().default(0),
  ownedPrivateRepos: z.number().optional().default(0),
  ownedReposCount: z.number().optional(),
  ownedPublicRepos: z.number().optional(),
  accessibleReposCount: z.number().optional(),
  followers: z.number().default(0),
  following: z.number().default(0),
});

const SummaryMetricsSchema = z.object({
  totalCommits: z.number().default(0),
  totalContributions: z.number().default(0),
  reposAnalyzed: z.number().default(0),
  reposSkipped: z.number().default(0),
  activeRepos: z.number().default(0),
  linesAdded: z.number().default(0),
  linesDeleted: z.number().default(0),
  netLines: z.number().default(0),
  prsAuthored: z.number().default(0),
  prsMerged: z.number().default(0),
  mergeRatePercentage: z.number().nullable().default(null),
  issuesAuthored: z.number().default(0),
  reviewsAuthored: z.number().default(0),
  reviewsAuthoredTruncated: z.boolean().optional(),
  starsReceived: z.number().default(0),
  forksReceived: z.number().default(0),
  longestStreakDays: z.number().default(0),
  activeStreakDays: z.number().default(0),
  totalActiveDays: z.number().default(0),
  longestInactiveGapDays: z.number().optional(),
  peakDailyCommits: z.number().optional(),
  averageDailyCommits: z.number().optional(),
  multiContributorRepoShare: z.number().optional(),
  functionalLanguageCount: z.number().optional(),
  timezone: z.string().optional(),
  timezoneAbbr: z.string().optional(),
  busiestHour: z.number().default(0),
  busiestWeekday: z.string().default("Monday"),
  busiestMonth: z.string().default(""),
  nightCommitPercentage: z.number().default(0),
  weekendCommitPercentage: z.number().default(0),
});

const HeatmapDaySchema = z.object({
  date: z.string(),
  count: z.number(),
  additions: z.number(),
  deletions: z.number(),
});

const MonthlyActivitySchema = z.object({
  month: z.string(),
  commits: z.number(),
  additions: z.number(),
  deletions: z.number(),
});

const TemporalActivitySchema = z.object({
  heatmapCalendar: z.array(HeatmapDaySchema).default([]),
  byHour: z.array(z.number()).length(24, "byHour must contain exactly 24 hourly buckets").default(new Array(24).fill(0)),
  byWeekday: z.array(z.number()).length(7, "byWeekday must contain exactly 7 daily buckets").default(new Array(7).fill(0)),
  byMonth: z.array(MonthlyActivitySchema).default([]),
  longestInactiveGapDays: z.number().default(0),
  peakDailyCommits: z.number().default(0),
  timezone: z.string().optional(),
  timezoneAbbr: z.string().optional(),
});

const RepoLanguageSchema = z.object({
  name: z.string(),
  bytes: z.number(),
  percentage: z.number(),
});

const RepositoryAnalysisSchema = z.object({
  id: z.number(),
  name: z.string(),
  fullName: z.string(),
  isPrivate: z.boolean().default(false),
  isFork: z.boolean().default(false),
  isArchived: z.boolean().default(false),
  defaultBranch: z.string().default("main"),
  stars: z.number().default(0),
  forks: z.number().default(0),
  openIssues: z.number().default(0),
  createdAt: z.string().default(""),
  lastPushedAt: z.string().default(""),
  primaryLanguage: z.string().nullable().default(null),
  languages: z.array(RepoLanguageSchema).default([]),
  commitCount: z.number().default(0),
  additions: z.number().default(0),
  deletions: z.number().default(0),
  netLines: z.number().default(0),
  prsAuthored: z.number().default(0),
  prsMerged: z.number().default(0),
  issuesAuthored: z.number().default(0),
  activitySpanDays: z.number().default(0),
  daysSinceLastPush: z.number().default(0),
  classification: z.string().optional(),
  fetchStatus: z.enum(["ok", "partial", "failed"]).default("ok"),
  fetchWarnings: z.array(z.string()).default([]),
});

const LanguageAnalysisSchema = z.object({
  name: z.string(),
  bytes: z.number(),
  percentage: z.number(),
  repoCount: z.number(),
});

const ClassificationEvidenceSchema = z.object({
  criterion: z.string(),
  actualValue: z.union([z.string(), z.number()]),
  threshold: z.string(),
  isSatisfied: z.boolean(),
});

const DeveloperClassificationSchema = z.object({
  id: z.string(),
  title: z.string(),
  tagline: z.string(),
  description: z.string(),
  badgeAccent: z.string(),
  evidenceStrength: z.enum(["LOW", "MODERATE", "HIGH", "VERY HIGH"]),
  evidence: z.array(ClassificationEvidenceSchema),
});

const RepositoryAwardSchema = z.object({
  id: z.string(),
  title: z.string(),
  category: z.enum(["SCALE", "VELOCITY", "CHAOS", "SURVIVAL", "CRAFT"]),
  repoFullName: z.string(),
  badge: z.string(),
  description: z.string(),
  evidence: z.string(),
});

const CourtChargeSchema = z.object({
  id: z.string(),
  chargeTitle: z.string(),
  allegation: z.string(),
  evidence: z.string(),
  verdict: z.enum(["GUILTY AS CHARGED", "ACQUITTED ON TECHNICALITY", "PROBATION"]),
  sentence: z.string(),
});

const DeterministicFindingSchema = z.object({
  id: z.string(),
  icon: z.string(),
  title: z.string(),
  evidence: z.string(),
  category: z.enum(["TEMPORAL", "CHURN", "LANGUAGES", "BEHAVIOR", "COLLABORATION"]),
});

const DeterministicEasterEggSchema = z.object({
  id: z.string(),
  title: z.string(),
  trigger: z.string(),
  unlockedAt: z.string(),
  dialogue: z.string(),
});

const RepoFailureEntrySchema = z.object({
  repoFullName: z.string(),
  phase: z.string(),
  error: z.string(),
});

const AnalysisDiagnosticsSchema = z.object({
  failedRepos: z.array(RepoFailureEntrySchema).default([]),
  truncatedRepos: z.array(RepoFailureEntrySchema).default([]),
  rateLimitHitCount: z.number().default(0),
  schedulerMaxRetries: z.number().default(3),
  graphqlContributionCalendarAvailable: z.boolean().default(false),
  warnings: z.array(z.string()).default([]),
});

export const GitopsyAnalysisImportSchema = z.object({
  id: z.string(),
  generatedAt: z.string(),
  isIncremental: z.boolean().default(false),
  durationMs: z.number().default(0),
  subjectLogin: z.string().optional(),
  subject: SubjectProfileSchema,
  summary: SummaryMetricsSchema,
  activity: TemporalActivitySchema.optional(),
  temporal: TemporalActivitySchema.optional(),
  repositories: z.array(RepositoryAnalysisSchema).default([]),
  languages: z.array(LanguageAnalysisSchema).default([]),
  commitForensics: CommitForensicsSchema,
  classifications: z.array(DeveloperClassificationSchema).default([]),
  primaryClassification: DeveloperClassificationSchema.optional(),
  awards: z.array(RepositoryAwardSchema).default([]),
  courtCharges: z.array(CourtChargeSchema).default([]),
  findings: z.array(DeterministicFindingSchema).default([]),
  easterEggs: z.array(DeterministicEasterEggSchema).default([]),
  diagnostics: AnalysisDiagnosticsSchema.default({
    failedRepos: [],
    truncatedRepos: [],
    rateLimitHitCount: 0,
    schedulerMaxRetries: 3,
    graphqlContributionCalendarAvailable: false,
    warnings: [],
  }),
  timezone: z.string().optional(),
  timezoneAbbr: z.string().optional(),
}).transform((data) => {
  // Normalize activity/temporal field
  const activity = data.activity || data.temporal || {
    heatmapCalendar: [],
    byHour: new Array(24).fill(0),
    byWeekday: new Array(7).fill(0),
    byMonth: [],
  };
  return {
    ...data,
    activity,
  };
});

// Substring matches are reserved for credential terms that can never appear
// in a legitimate analysis field name. Bare "auth" must NOT be a substring
// pattern: it strips authorship fields (authorDate, authorLogin) from
// exports, which then breaks schema validation on re-import. "auth" and
// "authorization" are matched as exact key names instead.
const SENSITIVE_KEY_SUBSTRINGS = ["token", "secret", "password", "verifier", "bearer"];
const SENSITIVE_KEY_EXACT = new Set(["auth", "authorization", "oauth_state", "code_challenge"]);

function isSensitiveKey(key: string): boolean {
  const lower = key.toLowerCase();
  if (SENSITIVE_KEY_EXACT.has(lower)) return true;
  return SENSITIVE_KEY_SUBSTRINGS.some((p) => lower.includes(p));
}

function containsSensitiveLogin(login: string): boolean {
  const lower = login.toLowerCase();
  return (
    lower.includes("token") ||
    lower.includes("secret") ||
    lower.includes("password") ||
    lower.includes("verifier") ||
    lower.includes("bearer")
  );
}

export class ForensicDataSanitizer {
  /**
   * Deep sanitizes any object to guarantee no tokens, secrets, or authorization data leak.
   * Strips any key whose name contains token/secret/password/verifier/auth/bearer.
   * Note: PII (bio, location, company) is intentionally preserved as it is part of
   * the forensic dossier; users should be aware exports contain this data.
   */
  public static sanitizeExportData<T>(data: T): T {
    const raw = JSON.stringify(data, (key, value) => {
      if (isSensitiveKey(key)) {
        return undefined;
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
    let parsed: unknown;
    try {
      parsed = JSON.parse(rawJson);
    } catch (err) {
      throw new Error(`Failed to parse JSON: ${err instanceof Error ? err.message : String(err)}`, { cause: err });
    }

    // Sanitize BEFORE validation so sensitive keys are stripped before the
    // schema sees them, preventing schema mismatches on redacted fields.
    const sanitized = this.sanitizeExportData(parsed);

    const validationResult = GitopsyAnalysisImportSchema.safeParse(sanitized);
    if (!validationResult.success) {
      const issues = validationResult.error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; ");
      throw new Error(`Autopsy file validation failed: ${issues}`);
    }

    const validated = validationResult.data as unknown as GitopsyAnalysis;

    if (validated.subject && containsSensitiveLogin(validated.subject.login)) {
      throw new Error("Imported subject login contains a sensitive keyword and was rejected for safety.");
    }

    try {
      await gitopsyDb.analyses.put(validated);
    } catch (err: any) {
      if (err?.name !== "MissingAPIError" && !err?.message?.includes("IndexedDB API missing")) {
        throw new Error(`Failed to persist imported analysis: ${err instanceof Error ? err.message : String(err)}`, { cause: err });
      }
    }

    return validated;
  }

  public static async purgeAllForensicData(): Promise<void> {
    try {
      await gitopsyDb.analyses.clear();
      await gitopsyDb.syncState.clear();
      await gitopsyDb.checkpoints.clear();
    } catch (err: any) {
      if (err?.name !== "MissingAPIError" && !err?.message?.includes("IndexedDB API missing")) {
        throw err;
      }
    }
  }
}
