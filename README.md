# GITOPSY
## Your GitHub, under examination.

> **GitHub + Autopsy**: Privacy-first forensic engineering intelligence and analytics that puts your entire GitHub history under a clinical microscope.
>
> **Philosophy**: *Serious data. Deterministic analysis. Ridiculous presentation.*

---

## ⚡ Key Highlights

- **Single Continuous Forensic Dossier**: A unified, responsive, scrollable report flowing from Subject Identity down to Executive Metrics, Heatmaps, Temporal Forensics, Repositories, Language DNA, Commit Forensics, Classifications, Courtroom, and Wrapped.
- **100% Deterministic & Factually Traceable**: Every metric, classification, award, charge, and finding is calculated directly from GitHub API data. **Zero LLMs, zero cloud databases, and zero fabricated medical/biological claims.**
- **Strict Local-First Privacy Boundary**: **Zero application database**. No PostgreSQL, MongoDB, Redis, Supabase, tracking pixels, or telemetry. All repository data, diffs, and analytics reside strictly inside the user's browser `IndexedDB` (via Dexie).
- **Dedicated Web Worker Pipeline**: Heavy network fetching, pagination, metrics normalization, and aggregation execute entirely in a background Web Worker (`analyzer.worker.ts`) to ensure a smooth 60fps main UI.
- **Evidence-Backed Developer Classifications**: Transparent classifications (*Night Owl Builder*, *Weekend Warrior*, *Polyglot Investigator*, *Refactor Machine*, *One-Project Specialist*, *Repository Hoarder*, *Commit Machine*, *Fix Addict*, *WIP Specialist*, *Steady Builder*, *The Monolith*) with explicit **Evidence Strength** (`LOW`, `MODERATE`, `HIGH`, `VERY HIGH`).
- **Deterministic Repository Awards**: *The Workhorse*, *The Main Character*, *The Ghost Town*, *The Comeback Kid*, *The Side Project*, *The Monolith*, *The Chaos Engine*.
- **Commit Message Forensics & Churn Metrics**: Regex message intent categorization (`feat`, `fix`, `refactor`, `chore`, `wip`, `merge`, `revert`, `docs`), size spectrum distribution, median commit size, and conventional-commit compliance.
- **Gitopsy Courtroom**: Interactive trial simulation ("The People vs @username") charging the developer with crimes against sleep and git hygiene based on verified statistics.
- **Gitopsy Wrapped**: Full-screen 15-chapter narrative journey celebrating your annual/lifetime records with audio-visual cues and confetti.
- **Secret Easter Eggs & Konami Code**: Hidden triggers responding to natural metrics (404, 3 AM push, 42, 69, 420, 1337) and keyboard sequences (`↑ ↑ ↓ ↓ ← → ← → B A`).
- **Modern Neo-Brutalism Design System**: High-contrast brutalist borders, hard offset box-shadows `4px 4px 0_0_#000`, bold typography, tactile click feedback, and custom Apache ECharts visualizations.
- **1-Click Demo Dossier**: Instant zero-auth inspection mode with a realistic multi-repository specimen dataset alongside GitHub App PKCE authorization.

---

## 🛠️ Architecture & Core Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 15 (App Router), React 19, TypeScript (Strict) |
| **Styling** | Tailwind CSS v4, Custom Neo-Brutalism Design Tokens |
| **Local Storage** | Dexie (IndexedDB), Versioned Schema & Migrations |
| **Concurrency** | Web Workers (Main Thread / Background Analyzer separation) |
| **Charts** | Apache ECharts with Custom Brutalist Tooltips & Color Palettes |
| **Data Layer** | Octokit, GitHub REST API v3, GitHub GraphQL API v4 |
| **Rate Limiter** | Forensic Request Scheduler (Bounded concurrency, backoff, retry) |
| **State** | Zustand (In-memory token management, zero storage persistence) |
| **Validation** | Zod (Import schema validation, export token sanitization) |
| **Testing** | Vitest (Unit & Integration), Playwright (E2E) |

---

## 🚀 Quickstart

### 1. Installation
```bash
cd githulyzer
pnpm install
```

### 2. Run Development Server
```bash
pnpm dev
```
Open [http://localhost:3000](http://localhost:3000) (or [http://localhost:3001](http://localhost:3001)) in your browser.

### 3. Run Test Suite
```bash
pnpm test
```

### 4. Build Production Bundle
```bash
pnpm build
```

---

## 🔒 Privacy & Security Invariants

Gitopsy operates under an uncompromising privacy invariant:
1. **Server as Authentication Boundary Only**: Minimal Next.js server routes exist solely to initiate GitHub App OAuth 2.0 with PKCE and securely exchange authorization codes.
2. **No Repository Data on Server**: Zero repository names, commits, diffs, or analytical results ever reach the Next.js server.
3. **In-Memory Credential Lifetime**: Access tokens are kept exclusively in memory during the active session; never written to `localStorage`, `IndexedDB`, or exported JSON files.
4. **Deep Data Redaction**: Export snapshots sanitize and strip 100% of tokens, authorization headers, and secrets.
