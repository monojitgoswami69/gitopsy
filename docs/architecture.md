# Architecture Specification

Gitopsy is built as a local-first, privacy-focused GitHub analytics engine. The system strictly isolates authentication from data analysis, running all data ingestion, aggregation, and mathematical evaluation inside the user's browser.

---

## 1. System Topology

```
┌─────────────────────────────────────────────────────────────┐
│                    USER BROWSER ENVIRONMENT                │
│                                                             │
│  ┌───────────────────────┐       ┌───────────────────────┐  │
│  │   Next.js React UI    │ <───> │  analyzer.worker.ts   │  │
│  │   - ECharts Dashboard │ Post  │  - Octokit REST / GQL │  │
│  │   - Neobrutalist UI   │ Msg   │  - Request Scheduler  │  │
│  │   - Zustand State     │       │  - Metrics Aggregator │  │
│  └───────────┬───────────┘       └───────────┬───────────┘  │
│              │                               │              │
│              ▼                               ▼              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │             Dexie.js (Browser IndexedDB)              │  │
│  │  - Saved Analyses, Sync States, Analysis Checkpoints  │  │
│  └───────────────────────────────────────────────────────┘  │
└──────────────────────────────┬──────────────────────────────┘
                               │ Direct Browser HTTPS Requests
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                      GITHUB API                             │
│  - REST API v3 (/user, /repos, /commits, /pulls, /issues)   │
│  - GraphQL API v4 (contributionsCollection, batch queries)  │
└─────────────────────────────────────────────────────────────┘
                               ▲
                               │ PKCE Code Exchange Only
┌──────────────────────────────┴──────────────────────────────┐
│                    NEXT.JS SERVER LAYER                     │
│               (AUTHENTICATION BOUNDARY ONLY)                │
│  - /api/auth/login     (PKCE Challenge & OAuth Redirect)    │
│  - /api/auth/callback  (Authorization Code Exchange)        │
│  - /api/auth/session   (Session Cookie Verification)        │
│  - /api/auth/logout    (Cookie Invalidation)                │
│  - /api/profile        (Basic Profile Retrieval & Cache)    │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Component Layers

### 2.1 Main Thread Layer (`src/components/`, `src/app/`)
- **User Interface**: Renders the responsive dashboard, navigational indices, reports console, and courtroom and classification modules using Tailwind CSS and custom Neo-Brutalism tokens.
- **Visualizations**: Uses Apache ECharts with custom canvas/SVG options, responsive resize listeners, and brutalist tooltips.
- **Worker Bridge (`ForensicWorkerClient`)**: Dispatches analysis jobs to the Web Worker and subscribes to typed progress events (`WorkerOutMessage`).

### 2.2 Background Web Worker Layer (`src/workers/`)
- **`analyzer.worker.ts`**: Executes in a separate operating system thread to keep the main UI fluid during large repository scans.
- **Pipeline Workflow**:
  1. Discovery of accessible repositories via GitHub REST / GraphQL.
  2. Concurrent fetching bounded by `ForensicRequestScheduler`.
  3. Incremental checkpointing saved to IndexedDB after each repository batch.
  4. Deterministic computation of temporal habits, commit forensics, code churn, archetypes, and awards.
  5. Emits real-time progress events back to the UI.

### 2.3 Rate Limiting & Scheduling (`src/lib/github/scheduler.ts`)
- **Bounded Concurrency**: Caps simultaneous active requests (default: 4 concurrent) to avoid secondary rate limits.
- **Rate-Limit Inspection**: Reads `x-ratelimit-remaining` and `x-ratelimit-reset` headers on each response.
- **Resumable Checkpoints**: When rate limits are reached, the worker saves state to IndexedDB and notifies the user with the exact resume timestamp.

### 2.4 Persistence Layer (`src/lib/db/`)
- **Dexie.js (IndexedDB)**: Manages `GitopsyForensicDB` schema storing analyses, checkpoints, and sync state.
- **Stale-While-Revalidate (SWR)**: Profile data hydrates synchronously from `sessionStorage` in 0ms while non-blocking background revalidation refreshes user metadata.
- **Data Export & Sanitization**: `ForensicDataSanitizer` deep-cleans all JSON export payloads to ensure tokens and secrets are never exported.
