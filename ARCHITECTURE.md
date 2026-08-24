# GITOPSY ARCHITECTURE SPECIFICATION

## 1. Architectural Philosophy & Boundary

Gitopsy is built as a **local-first, privacy-guaranteed engineering intelligence tool**. The application strictly separates the authentication boundary from the data analysis pipeline:

```
┌─────────────────────────────────────────────────────────────┐
│                    USER BROWSER ENVIRONMENT                │
│                                                             │
│  ┌───────────────────────┐       ┌───────────────────────┐  │
│  │   React 19 Main UI    │ <───> │  analyzer.worker.ts   │  │
│  │   - ECharts           │ Post  │  - Octokit REST/GQL   │  │
│  │   - Neobrutalism      │ Msg   │  - Request Scheduler  │  │
│  │   - Navigation        │       │  - Metrics & Vitals   │  │
│  └───────────┬───────────┘       └───────────┬───────────┘  │
│              │                               │              │
│              ▼                               ▼              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │         Dexie IndexedDB (Local Storage Engine)        │  │
│  │  - profiles, repos, commits, PRs, issues, analyses    │  │
│  └───────────────────────────────────────────────────────┘  │
└──────────────────────────────┬──────────────────────────────┘
                               │ Direct Browser-to-GitHub API
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                      GITHUB PLATFORM                        │
│  - REST API v3 (/user/repos, /commits, /pulls, /issues)      │
│  - GraphQL API v4 (contributionsCollection, batch queries)   │
└─────────────────────────────────────────────────────────────┘
                               ▲
                               │ PKCE Authorization Code Exchange
┌──────────────────────────────┴──────────────────────────────┐
│                    NEXT.JS SERVER LAYER                     │
│               (AUTHENTICATION BOUNDARY ONLY)                │
│  - /api/auth/login     (Generates PKCE challenge & state)   │
│  - /api/auth/callback  (Exchanges code for access token)    │
│  - /api/auth/session   (One-time in-memory token handover)  │
│  - /api/auth/logout    (Cleans temporary session cookie)    │
│                                                             │
│  * ZERO REPO DATA * ZERO COMMIT DATA * ZERO USER DATABASE   │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Component Layers

### 2.1 Main Thread Layer (`src/components/`, `src/app/`)
- **Rendering & Interaction**: Manages UI state, route navigation, brutalist theme toggles, modal dialogs, and tactile animations.
- **Visualizations**: Uses Apache ECharts (SVG/Canvas) with bespoke Neobrutalist design configurations (hard borders, custom monospace tooltips, high-contrast palette).
- **Worker Bridge**: Communicates with the background Web Worker via strongly typed messages (`WorkerInMessage` / `WorkerOutMessage`).

### 2.2 Background Web Worker Layer (`src/workers/`)
- **`analyzer.worker.ts`**: Runs independently of the React main thread to prevent UI freezing during large repository scans (tens of thousands of commits).
- **Forensic Pipeline**:
  1. Profile & specimen discovery via Octokit REST / GraphQL.
  2. Bounded pagination with `ForensicRequestScheduler`.
  3. Incremental synchronization check against `syncState` in IndexedDB.
  4. Mathematical calculation of Developer Classifications, Churn Distributions, Repository Awards, Commit Forensics, Court Charges, and Findings.
  5. Emits granular progress messages with rotating coroner dispatches.

### 2.3 Rate Limiting & Scheduler Layer (`src/lib/github/scheduler.ts`)
- **Bounded Concurrency**: Caps simultaneous active requests (default: 4 concurrent) to avoid triggering GitHub's secondary rate limits.
- **Inspection**: Monitors `x-ratelimit-remaining`, `x-ratelimit-reset`, and `retry-after` HTTP response headers.
- **Backoff & Jitter**: Implements exponential backoff with random jitter on transient server errors (500–504).
- **Throttling Alerts**: Intercepts 429 and secondary rate limit 403s, notifying the worker and UI with informative advisories: *"GitHub has asked us to calm down."*

### 2.4 Persistence Layer (`src/lib/db/`)
- **IndexedDB via Dexie**: Versioned local schema storing profiles, repositories, commits, pull requests, issues, reviews, analyses, awards, archetypes, and sync state.
- **Incremental Autopsy**: Evaluates commit SHAs and `lastFetchedAt` timestamps to fetch only recent changes since the previous examination.
- **Safe Export / Import**: Deep sanitization strips all sensitive auth tokens before generating JSON snapshots. Validates imported files using Zod.
