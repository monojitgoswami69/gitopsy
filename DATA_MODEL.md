# GITOPSY DOMAIN & DATA MODEL SPECIFICATION

## 1. Domain Models (`src/types/domain.ts`)

```
GitopsyAnalysis
├── SubjectProfile (login, name, avatarUrl, bio, company, location, publicRepos, privateRepos, followers, following)
├── SummaryMetrics (totalCommits, reposAnalyzed, linesAdded, linesDeleted, netLines, streaks, mergeRate)
├── TemporalActivity (heatmapCalendar, byHour, byWeekday, byMonth)
├── RepositoryAnalysis[] (commitCount, additions, deletions, netLines, languages, stars, forks, PRs, issues, activitySpanDays)
├── LanguageAnalysis[] (name, bytes, percentage, repoCount)
├── CommitForensics (messageCategories, sizeDistribution, medianCommitSize, conventionalCommitCount, shortMessageCount, largestCommit)
├── DeveloperClassification[] (title, tagline, description, evidenceStrength, evidence checklist)
├── RepositoryAward[] (category, badge, title, repoFullName, evidence)
├── CourtCharge[] (chargeTitle, allegation, evidence, verdict, sentence)
├── DeterministicFinding[] (icon, title, evidence, category)
└── DeterministicEasterEgg[] (title, trigger, dialogue, unlockedAt)
```

---

## 2. IndexedDB Schema (Dexie Engine)

Database Name: `GitopsyForensicDB` (Version 2)

| Table | Primary Key | Indices |
|---|---|---|
| `analyses` | `id` | `generatedAt`, `isIncremental` |
| `syncState` | `repoFullName` | `lastFetchedAt` |

---

## 3. Sanitized Export Schema
Exported JSON files contain 100% of analytical metrics, repositories, classifications, charges, findings, and easter eggs. All authorization headers, tokens, and secrets are strictly redacted by `ForensicDataSanitizer`.
