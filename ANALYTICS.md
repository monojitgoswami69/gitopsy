# GITOPSY ANALYTICS & DETERMINISTIC FORMULATIONS

Every analytical metric, developer classification, repository award, and court charge in Gitopsy is **mathematically deterministic, transparent, and grounded strictly in real GitHub API data**. Zero LLMs or fabricated physiological claims.

---

## 1. Developer Classifications & Thresholds

| Classification | Deterministic Threshold Criteria | Evidence Strength Model |
|---|---|---|
| **NIGHT OWL BUILDER** | $\ge 35\%$ of commits timestamped between 21:00 and 04:00 UTC | `LOW` if $<10$ commits, `MODERATE` if margin $<5\%$, `HIGH` if margin $<20\%$, `VERY HIGH` if margin $\ge 20\%$ |
| **WEEKEND WARRIOR** | $\ge 30\%$ of commits timestamped on Saturday or Sunday | Based on sample size & margin above $30\%$ threshold |
| **POLYGLOT INVESTIGATOR** | Active bytes reported across $\ge 4$ distinct programming languages | Bounded by language diversity and detected byte volume |
| **REFACTOR MACHINE** | Deletion-to-addition churn ratio $\ge 0.40$ with $\ge 500$ total lines deleted | Scaled by total deletion volume and churn percentage |
| **ONE-PROJECT SPECIALIST** | $\ge 60\%$ of all commit activity concentrated in a single repository ($\ge 15$ commits) | Scaled by primary repository concentration percentage |
| **REPOSITORY HOARDER** | $\ge 10$ total accessible repositories with $\ge 50\%$ having $\le 2$ commits | Scaled by repository count and quiet ratio |
| **STEADY BUILDER** | Longest consecutive streak $\ge 7$ days with activity logged across all 7 weekdays | Scaled by streak duration |
| **FIX ADDICT** | $\ge 20\%$ of commit messages contain "fix" terminology (`fix:`, `bug`, `patch`, `resolve`) | Scaled by fix percentage margin |
| **WIP SPECIALIST** | $\ge 5\%$ of commit messages contain `wip` or `work in progress` | Scaled by WIP message density |

---

## 2. Deterministic Repository Awards

1. **THE WORKHORSE**: Assigned to the repository with the highest overall commit count ($\ge 10$ commits).
2. **THE MAIN CHARACTER**: Assigned to any repository commanding $\ge 40\%$ of the user's total code activity ($\ge 15$ commits).
3. **THE GHOST TOWN**: Substantial historical activity ($\ge 5$ commits) currently dormant with no pushes for $\ge 180$ days.
4. **THE COMEBACK KID**: Activity span $\ge 180$ days revived with a recent push in the last 30 days ($\ge 8$ commits).
5. **THE SIDE PROJECT**: Low commit count ($3 - 15$ commits) developed alongside primary repositories.
6. **THE CHAOS ENGINE**: Highest churn ratio relative to commit count ($>200$ lines churned per commit).
7. **THE MONOLITH**: Single repository containing $\ge 60\%$ of the user's entire GitHub commit output ($\ge 20$ commits).

---

## 3. Commit Message Intent Regex Categorization

- `FEAT`: `/^feat(\(.*\))?:|^add\b|^create\b|^implement\b/i`
- `FIX`: `/^fix(\(.*\))?:|^bug\b|^patch\b|^resolve\b/i`
- `REFACTOR`: `/^refactor(\(.*\))?:|^clean\b|^rewrite\b/i`
- `DOCS`: `/^docs(\(.*\))?:|^readme\b|^doc\b/i`
- `CHORE`: `/^chore(\(.*\))?:|^bump\b|^deps\b|^build\b/i`
- `TEST`: `/^test(\(.*\))?:|^spec\b/i`
- `PERF`: `/^perf(\(.*\))?:|^optimize\b/i`
- `WIP`: `/^wip\b|work in progress/i`
- `MERGE`: `commit.isMerge || /^merge\b/i`
- `REVERT`: `commit.isRevert || /^revert\b/i`
