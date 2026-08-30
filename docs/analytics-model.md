# Analytics & Data Model Specification

Every metric, developer classification, repository award, and trial charge in Gitopsy is mathematically deterministic, transparent, and grounded strictly in verified GitHub API data.

---

## 1. Developer Classifications & Criteria

| Classification | Threshold Criteria | Evidence Model |
|---|---|---|
| **NIGHT OWL** | $\ge 35\%$ of commits timestamped between 21:00 and 04:59 local time ($\ge 20$ commits) | Strength scales with sample size and percentage margin above threshold |
| **MORNING SKYLARK** | $\ge 25\%$ of commits timestamped between 05:00 and 09:59 local time ($\ge 20$ commits) | Strength scales with sample size and percentage margin above threshold |
| **WEEKEND WARRIOR** | $\ge 30\%$ of commits timestamped on Saturday or Sunday ($\ge 20$ commits) | Strength scales with weekend percentage and commit volume |
| **WEEKDAY GRINDER** | $\ge 85\%$ of commits timestamped Monday through Friday ($\ge 20$ commits) | Strength scales with weekday concentration |
| **ATOMIC COMMITER** | Median commit diff size $\le 30$ lines churned ($\ge 15$ commits) | Scaled by small commit proportion |
| **BATCH COMMITER** | Median commit diff size $\ge 250$ lines churned ($\ge 15$ commits) | Scaled by large commit proportion |
| **CONVENTIONAL DEV** | $\ge 60\%$ of commit messages adhere to Conventional Commits standard ($\ge 15$ commits) | Scaled by conventional percentage |
| **SOLO OPERATOR** | $\ge 40$ commits with 0 pull requests and 0 code reviews authored | Independent contributor workflow signature |
| **CODE ARTISAN** | High craft indicator: $\ge 40\%$ conventional messages, avg message length $\ge 30$ chars, and detailed diffs | Scaled by commit care index |
| **POLYGLOT INVESTIGATOR** | Active bytes distributed across $\ge 4$ distinct functional programming languages | Bounded by language count and byte distribution |
| **REFACTOR MACHINE** | Bounded churn ratio $\ge 0.40$ ($\frac{\text{deletions}}{\text{additions} + \text{deletions}}$) with $\ge 500$ lines deleted | Scaled by total deletion volume and churn percentage |
| **ONE-PROJECT SPECIALIST** | $\ge 60\%$ of all commit activity concentrated in a single repository ($\ge 15$ commits) | Scaled by primary repository concentration percentage |
| **WIDE-NET EXPLORER** | $\ge 6$ active repositories with no single repo exceeding $35\%$ of total commits | Scaled by repository dispersion |
| **REPOSITORY HOARDER** | $\ge 10$ total accessible repositories with $\ge 50\%$ having $\le 2$ commits | Scaled by repository count and quiet ratio |
| **STEADY BUILDER** | Longest consecutive active streak $\ge 7$ days with commits across weekdays | Scaled by streak duration |
| **FIX SPECIALIST** | $\ge 20\%$ of commit messages match fix patterns (`fix:`, `bug`, `patch`, `resolve`) | Scaled by fix pattern density |
| **WIP SPECIALIST** | $\ge 5\%$ of commit messages contain `wip` or `work in progress` | Scaled by WIP pattern density |
| **MINIMALIST** | Average commit message length $\le 15$ characters ($\ge 20$ commits) | Scaled by message brevity |

---

## 2. Code Churn & Metric Formulations

### Bounded Churn Ratio
$$\text{churnRatio} = \begin{cases} 
\frac{\text{linesDeleted}}{\text{linesAdded} + \text{linesDeleted}} & \text{if } \text{linesAdded} + \text{linesDeleted} > 0 \\
0 & \text{otherwise}
\end{cases} \quad \in [0, 1]$$

### Review Count & Search Bounds
GitHub Search API `/search/issues` queries for `reviewed-by:{login}` are bounded at a 1,000 result maximum. When this limit is reached, `reviewsAuthoredTruncated` is flagged `true`, and all displays indicate `1,000+` to avoid false precision.

---

## 3. Repository Awards

- **THE WORKHORSE**: Awarded to the repository with the highest overall commit count ($\ge 10$ commits).
- **THE MAIN CHARACTER**: Awarded to any repository commanding $\ge 40\%$ of total commit activity ($\ge 15$ commits).
- **THE GHOST TOWN**: Substantial historical activity ($\ge 5$ commits) currently dormant with no pushes for $\ge 180$ days.
- **THE COMEBACK KID**: Activity span $\ge 180$ days revived with a recent push in the last 30 days ($\ge 8$ commits).
- **THE SIDE PROJECT**: Low commit count ($3 - 15$ commits) developed alongside primary repositories.
- **THE CHAOS ENGINE**: Highest churn ratio relative to commit count ($>200$ lines churned per commit).
- **THE MONOLITH**: Single repository containing $\ge 60\%$ of total commit volume ($\ge 20$ commits).

---

## 4. Domain & IndexedDB Data Model

### Database: `GitopsyForensicDB` (Dexie.js)

| Table | Primary Key | Indexed Fields | Purpose |
|---|---|---|---|
| `analyses` | `id` | `generatedAt`, `isIncremental`, `subjectLogin` | Complete audited reports |
| `syncState` | `repoFullName` | `lastFetchedAt` | Incremental sync markers per repository |
| `checkpoints` | `checkpointId` | `subjectLogin`, `resumeAt` | Resumable state for rate-limited scans |

