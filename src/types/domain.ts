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
  reposAnalyzed: number;
  activeRepos: number;
  linesAdded: number;
  linesDeleted: number;
  netLines: number;
  prsAuthored: number;
  prsMerged: number;
  mergeRatePercentage: number;
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
  nightCommitPercentage: number; // 21:00 - 04:00 UTC
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

export interface GitopsyAnalysis {
  id: string;
  generatedAt: string;
  isIncremental: boolean;
  durationMs: number;
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
}

export type WorkerInMessage =
  | { type: "START_ANALYSIS"; payload: { token: string; username?: string; isIncremental?: boolean; sinceDate?: string } }
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
  | { type: "RATE_LIMIT"; payload: { resetAt: string; waitSeconds: number; message: string } }
  | { type: "WARNING"; payload: { message: string; code: string } }
  | { type: "COMPLETE"; payload: { report: GitopsyAnalysis } }
  | { type: "ERROR"; payload: { error: string; details?: unknown } };
