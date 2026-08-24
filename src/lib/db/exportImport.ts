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

const CommitForensicsSchema = z.object({
  totalAnalyzed: z.number(),
  detailedCommitsCount: z.number().default(0),
  averageAdditionsPerCommit: z.number(),
  averageDeletionsPerCommit: z.number(),
  medianCommitSize: z.number(),
  churnRatio: z.number(),
  sizeDistribution: SizeDistributionSchema,
  messageCategories: z.array(CommitMessageCategorySchema),
  shortMessageCount: z.number(),
  repeatedMessageCount: z.number(),
  conventionalCommitCount: z.number(),
  largestCommit: z
    .object({
      sha: z.string(),
      repoFullName: z.string(),
      message: z.string(),
      additions: z.number(),
      deletions: z.number(),
      filesChanged: z.number(),
    })
    .nullable(),
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
  totalCommits: z.number(),
  totalContributions: z.number().default(0),
  reposAnalyzed: z.number(),
  reposSkipped: z.number().default(0),
  activeRepos: z.number(),
  linesAdded: z.number(),
  linesDeleted: z.number(),
  netLines: z.number(),
  prsAuthored: z.number(),
  prsMerged: z.number(),
  mergeRatePercentage: z.number().nullable(),
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
  heatmapCalendar: z.array(HeatmapDaySchema),
  byHour: z.array(z.number()),
  byWeekday: z.array(z.number()),
  byMonth: z.array(MonthlyActivitySchema),
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
  isPrivate: z.boolean(),
  isFork: z.boolean(),
  isArchived: z.boolean(),
  defaultBranch: z.string(),
  stars: z.number(),
  forks: z.number(),
  openIssues: z.number(),
  createdAt: z.string(),
  lastPushedAt: z.string(),
  primaryLanguage: z.string().nullable(),
  languages: z.array(RepoLanguageSchema),
  commitCount: z.number(),
  additions: z.number(),
  deletions: z.number(),
  netLines: z.number(),
  prsAuthored: z.number(),
  prsMerged: z.number(),
  issuesAuthored: z.number(),
  activitySpanDays: z.number(),
  daysSinceLastPush: z.number(),
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
  category: z.enum(["TEMPORAL", "CHURN", "LANGUAGES", "BEHAVIOR"]),
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
  isIncremental: z.boolean(),
  durationMs: z.number(),
  subjectLogin: z.string().optional(),
  subject: SubjectProfileSchema,
  summary: SummaryMetricsSchema,
  activity: TemporalActivitySchema,
  repositories: z.array(RepositoryAnalysisSchema),
  languages: z.array(LanguageAnalysisSchema),
  commitForensics: CommitForensicsSchema,
  classifications: z.array(DeveloperClassificationSchema),
  primaryClassification: DeveloperClassificationSchema,
  awards: z.array(RepositoryAwardSchema),
  courtCharges: z.array(CourtChargeSchema),
  findings: z.array(DeterministicFindingSchema),
  easterEggs: z.array(DeterministicEasterEggSchema),
  diagnostics: AnalysisDiagnosticsSchema.default({
    failedRepos: [],
    truncatedRepos: [],
    rateLimitHitCount: 0,
    schedulerMaxRetries: 3,
    graphqlContributionCalendarAvailable: false,
    warnings: [],
  }),
});

const SENSITIVE_KEY_PATTERNS = ["token", "secret", "password", "verifier", "auth", "bearer"];

function isSensitiveKey(key: string): boolean {
  const lower = key.toLowerCase();
  return SENSITIVE_KEY_PATTERNS.some((p) => lower.includes(p));
}

function containsSensitiveLogin(login: string): boolean {
  return SENSITIVE_KEY_PATTERNS.some((p) => login.toLowerCase().includes(p));
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
      throw new Error(`Failed to parse JSON: ${err instanceof Error ? err.message : String(err)}`);
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
    } catch (err) {
      throw new Error(`Failed to persist imported analysis: ${err instanceof Error ? err.message : String(err)}`);
    }

    return validated;
  }

  public static async purgeAllForensicData(): Promise<void> {
    await gitopsyDb.analyses.clear();
    await gitopsyDb.syncState.clear();
  }
}
