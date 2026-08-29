# Analytics & Data Model Specification

Every metric, developer classification, repository award, and trial charge in Gitopsy is mathematically deterministic, transparent, and grounded strictly in verified GitHub API data.

---

## 1. Developer Classifications & Criteria

| Classification | Threshold Criteria | Evidence Model |
|---|---|---|
| **NIGHT OWL** | $\ge 35\%$ of commits timestamped between 21:00 and 04:59 local time ($\ge 20$ commits) | Strength scales with sample size and percentage margin above threshold |
| **MORNING SKYLARK** | $\ge 25\%$ of commits timestamped between 05:00 and 09:59 local time ($\ge 20$ commits) | Strength scales with sample size and percentage margin above threshold |
| **WEEKEND WARRIOR** | $\ge 30\%$ of commits timestamped on Saturday or Sunday ($\ge 20$ commits) | Strength scales with weekend percentage and commit volume |
| **POLYGLOT INVESTIGATOR** | Active bytes distributed across $\ge 4$ distinct programming languages | Bounded by language count and byte distribution |
| **REFACTOR MACHINE** | Deletion-to-addition churn ratio $\ge 0.40$ with $\ge 500$ total lines deleted | Scaled by total deletion volume and churn percentage |
| **ONE-PROJECT SPECIALIST** | $\ge 60\%$ of all commit activity concentrated in a single repository ($\ge 15$ commits) | Scaled by primary repository concentration percentage |
| **REPOSITORY HOARDER** | $\ge 10$ total accessible repositories with $\ge 50\%$ having $\le 2$ commits | Scaled by repository count and quiet ratio |
| **STEADY BUILDER** | Longest consecutive active streak $\ge 7$ days with commits across weekdays | Scaled by streak duration |
| **FIX SPECIALIST** | $\ge 20\%$ of commit messages match fix patterns (`fix:`, `bug`, `patch`, `resolve`) | Scaled by fix pattern density |
| **WIP SPECIALIST** | $\ge 5\%$ of commit messages contain `wip` or `work in progress` | Scaled by WIP pattern density |

---

## 2. Repository Awards

- **THE WORKHORSE**: Awarded to the repository with the highest overall commit count ($\ge 10$ commits).
- **THE MAIN CHARACTER**: Awarded to any repository commanding $\ge 40\%$ of total commit activity ($\ge 15$ commits).
- **THE GHOST TOWN**: Substantial historical activity ($\ge 5$ commits) currently dormant with no pushes for $\ge 180$ days.
- **THE COMEBACK KID**: Activity span $\ge 180$ days revived with a recent push in the last 30 days ($\ge 8$ commits).
- **THE SIDE PROJECT**: Low commit count ($3 - 15$ commits) developed alongside primary repositories.
- **THE CHAOS ENGINE**: Highest churn ratio relative to commit count ($>200$ lines churned per commit).
- **THE MONOLITH**: Single repository containing $\ge 60\%$ of total commit volume ($\ge 20$ commits).

---

## 3. Commit Message Categorization

Commit messages are evaluated using regular expression intent matchers:
- **FEAT**: `/^feat(\(.*\))?:|^add\b|^create\b|^implement\b/i`
- **FIX**: `/^fix(\(.*\))?:|^bug\b|^patch\b|^resolve\b/i`
- **REFACTOR**: `/^refactor(\(.*\))?:|^clean\b|^rewrite\b/i`
- **DOCS**: `/^docs(\(.*\))?:|^readme\b|^doc\b/i`
- **CHORE**: `/^chore(\(.*\))?:|^bump\b|^deps\b|^build\b/i`
- **TEST**: `/^test(\(.*\))?:|^spec\b/i`
- **PERF**: `/^perf(\(.*\))?:|^optimize\b/i`
- **WIP**: `/^wip\b|work in progress/i`
- **MERGE**: `commit.isMerge || /^merge\b/i`
- **REVERT**: `commit.isRevert || /^revert\b/i`

---

## 4. Domain & IndexedDB Data Model

### Database: `GitopsyForensicDB` (Dexie.js)

| Table | Primary Key | Indexed Fields | Purpose |
|---|---|---|---|
| `analyses` | `id` | `generatedAt`, `isIncremental`, `subjectLogin` | Complete audited reports |
| `syncState` | `repoFullName` | `lastFetchedAt` | Incremental sync markers per repository |
| `checkpoints` | `checkpointId` | `subjectLogin`, `resumeAt` | Resumable state for rate-limited scans |
