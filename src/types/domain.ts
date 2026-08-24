/**
 * GITOPSY DOMAIN SCHEMA
 * Strictly deterministic, traceable, and grounded exclusively in real GitHub data.
 */

export interface SubjectProfile {
  login: string;
  name: string | null;
  avatarUrl: string;
  bio: string | null;
  company: string | null;
  location: string | null;
  createdAt: string;
  publicRepos: number;
  totalPrivateRepos: number;
  ownedReposCount?: number;
  ownedPublicRepos?: number;
  ownedPrivateRepos?: number;
  accessibleReposCount?: number;
  followers: number;
  following: number;
}

export interface SummaryMetrics {
  totalCommits: number;
  totalContributions: number;
  reposAnalyzed: number;
  reposSkipped: number;
  activeRepos: number;
  linesAdded: number;
  linesDeleted: number;
  netLines: number;
  prsAuthored: number;
  prsMerged: number;
  mergeRatePercentage: number | null;
  issuesAuthored: number;
  reviewsAuthored: number;
  starsReceived: number;
  forksReceived: number;
  longestStreakDays: number;
  activeStreakDays: number;
  totalActiveDays: number;
  busiestHour: number; // 0-23 UTC
  busiestWeekday: string;
  busiestMonth: string;
  nightCommitPercentage: number; // 21:00 - 04:59 UTC
  weekendCommitPercentage: number; // Sat & Sun
}

export interface HeatmapDay {
  date: string;
  count: number;
  additions: number;
  deletions: number;
}

export interface TemporalActivity {
  heatmapCalendar: HeatmapDay[];
  byHour: number[]; // 24 items
  byWeekday: number[]; // 7 items (0=Sun .. 6=Sat)
  byMonth: { month: string; commits: number; additions: number; deletions: number }[];
}

export interface RepositoryAnalysis {
  id: number;
  name: string;
  fullName: string;
  isPrivate: boolean;
  isFork: boolean;
  isArchived: boolean;
  defaultBranch: string;
  stars: number;
  forks: number;
  openIssues: number;
  createdAt: string;
  lastPushedAt: string;
  primaryLanguage: string | null;
  languages: { name: string; bytes: number; percentage: number }[];
  commitCount: number;
  additions: number;
  deletions: number;
  netLines: number;
  prsAuthored: number;
  prsMerged: number;
  issuesAuthored: number;
  activitySpanDays: number;
  daysSinceLastPush: number;
  classification?: string;
  fetchStatus: "ok" | "partial" | "failed";
  fetchWarnings: string[];
}

export interface LanguageAnalysis {
  name: string;
  bytes: number;
  percentage: number;
  repoCount: number;
}

export interface CommitMessageCategory {
  category: string;
  count: number;
  percentage: number;
}

export interface CommitForensics {
  totalAnalyzed: number;
  detailedCommitsCount: number;
  averageAdditionsPerCommit: number;
  averageDeletionsPerCommit: number;
  medianCommitSize: number;
  churnRatio: number;
  sizeDistribution: {
    tiny: number; // < 10 lines
    small: number; // 10 - 50 lines
    medium: number; // 50 - 200 lines
    large: number; // 200 - 1000 lines
    monster: number; // > 1000 lines
  };
  messageCategories: CommitMessageCategory[];
  shortMessageCount: number;
  repeatedMessageCount: number;
  conventionalCommitCount: number;
  largestCommit: {
    sha: string;
    repoFullName: string;
    message: string;
    additions: number;
    deletions: number;
    filesChanged: number;
  } | null;
}

export interface DeveloperClassification {
  id: string;
  title: string;
  tagline: string;
  description: string;
  badgeAccent: string;
  evidenceStrength: "LOW" | "MODERATE" | "HIGH" | "VERY HIGH";
  evidence: {
    criterion: string;
    actualValue: string | number;
    threshold: string;
    isSatisfied: boolean;
  }[];
}

export interface RepositoryAward {
  id: string;
  title: string;
  category: "SCALE" | "VELOCITY" | "CHAOS" | "SURVIVAL" | "CRAFT";
  repoFullName: string;
  badge: string;
  description: string;
  evidence: string;
}

export interface CourtCharge {
  id: string;
  chargeTitle: string;
  allegation: string;
  evidence: string;
  verdict: "GUILTY AS CHARGED" | "ACQUITTED ON TECHNICALITY" | "PROBATION";
  sentence: string;
}

export interface DeterministicFinding {
  id: string;
  icon: string;
  title: string;
  evidence: string;
  category: "TEMPORAL" | "CHURN" | "LANGUAGES" | "BEHAVIOR";
}

export interface DeterministicEasterEgg {
  id: string;
  title: string;
  trigger: string;
  unlockedAt: string;
  dialogue: string;
}

export interface RepoFailureEntry {
  repoFullName: string;
  phase: string;
  error: string;
}

export interface AnalysisDiagnostics {
  failedRepos: RepoFailureEntry[];
  truncatedRepos: RepoFailureEntry[];
  rateLimitHitCount: number;
  schedulerMaxRetries: number;
  graphqlContributionCalendarAvailable: boolean;
  warnings: string[];
}

export interface AnalysisCheckpoint {
  checkpointId: string;
  subjectLogin: string;
  startedAt: string;
  lastSavedAt: string;
  sinceDate?: string;
  isIncremental: boolean;
  maxConcurrency: number;

  profile: SubjectProfile | null;
  reposToScan: {
    id: number;
    name: string;
    fullName: string;
    isPrivate: boolean;
    isFork: boolean;
    isArchived: boolean;
    defaultBranch: string;
    stars: number;
    forks: number;
    openIssues: number;
    sizeKb: number;
    createdAt: string;
    updatedAt: string;
    lastPushedAt: string;
    primaryLanguage: string | null;
    topics: string[];
  }[];

  processedRepoFullNames: string[];
  failedRepos: RepoFailureEntry[];
  truncatedRepos: RepoFailureEntry[];

  processedRepos: RepositoryAnalysis[];
  allCommits: ForensicCommit[];
  allWeeks: { w: number; a: number; d: number; c: number }[];
  languageMapEntries: [string, { bytes: number; repoCount: number }][];

  rateLimitHitCount: number;
  diagnosticsWarnings: string[];
  graphqlContributionCalendarAvailable: boolean;

  rateLimitResetEpoch: number;
  resumeAt: string;
  resumeReason: string;
}

export interface GitopsyAnalysis {
  id: string;
  generatedAt: string;
  isIncremental: boolean;
  durationMs: number;
  subjectLogin: string;
  subject: SubjectProfile;
  summary: SummaryMetrics;
  activity: TemporalActivity;
  repositories: RepositoryAnalysis[];
  languages: LanguageAnalysis[];
  commitForensics: CommitForensics;
  classifications: DeveloperClassification[];
  primaryClassification: DeveloperClassification;
  awards: RepositoryAward[];
  courtCharges: CourtCharge[];
  findings: DeterministicFinding[];
  easterEggs: DeterministicEasterEgg[];
  diagnostics: AnalysisDiagnostics;
}

export interface ForensicCommit {
  sha: string;
  repoFullName: string;
  authorLogin: string;
  authorDate: string;
  message: string;
  additions: number;
  deletions: number;
  filesChanged: number;
  isMerge: boolean;
  isRevert: boolean;
  hour: number;
  weekday: number;
  month: string;
  hasDetails: boolean;
}

export type WorkerInMessage =
  | { type: "START_ANALYSIS"; payload: { token: string; username?: string; isIncremental?: boolean; sinceDate?: string; maxConcurrency?: number } }
  | { type: "RESUME"; payload: { token: string; checkpoint: AnalysisCheckpoint; maxConcurrency?: number } }
  | { type: "CANCEL" };

export type WorkerOutMessage =
  | {
      type: "PROGRESS";
      payload: {
        phase: string;
        currentItem: string;
        current: number;
        total: number;
        percentage: number;
        message: string;
        rateLimitRemaining?: number;
      };
    }
  | { type: "RATE_LIMIT"; payload: { resetAt: string; waitSeconds: number; message: string; isTerminal: boolean } }
  | { type: "RESUME_AVAILABLE"; payload: { checkpointId: string; resumeAt: string; resumeReason: string; resetEpoch: number } }
  | { type: "CHECKPOINT_SAVED"; payload: { checkpointId: string; reposProcessed: number; reposTotal: number } }
  | { type: "REPO_WARNING"; payload: { repoFullName: string; phase: string; error: string } }
  | { type: "WARNING"; payload: { message: string; code: string } }
  | { type: "LOG"; payload: { level: "info" | "warn" | "error"; message: string } }
  | { type: "COMPLETE"; payload: { report: GitopsyAnalysis } }
  | { type: "ERROR"; payload: { error: string; details?: unknown } }
  | { type: "CANCELLED" };
