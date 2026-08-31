# Gitopsy

A local-first, privacy-focused GitHub forensic intelligence and analytics engine built with Next.js, Web Workers, and IndexedDB.

Gitopsy analyzes your version control patterns, 24-hour commit distributions, code churn, commit forensics, developer archetypes, repository awards, and version control charges using deterministic calculations running entirely in your browser.

---

## Highlights

- **Local-First Processing**: Analysis, aggregation, and persistence run entirely in the browser using a dedicated Web Worker and IndexedDB (Dexie.js). Repository code, diffs, and commit histories never leave your machine or touch external servers.
- **24-Hour Temporal Clocks**: Visualizes 24-hour commit activity, weekday distributions, active streaks, and nocturnal ratios derived directly from author timestamps and local timezones.
- **Commit Forensics & Code Churn**: Analyzes conventional commit adherence, commit size distributions, message verbosity, and bounded line deletion-to-addition churn ratios.
- **Deterministic Archetypes**: Classifies workflow habits (such as Night Owl, Weekend Warrior, Solo Operator, Code Artisan, Polyglot, Refactor Machine) with verifiable, rule-based criteria.
- **Court of Version Control & Awards**: Generates satirical yet mathematically grounded courtroom indictments, verdict sentences, and repository accolades.
- **Resilient & Resumable Scheduling**: Concurrency-bounded GitHub API scheduler with 202 warm-up retry loops, primary/secondary rate-limit detection, and periodic checkpoint-resume state.
- **Sanitized Export & Import**: Complete forensic dossier export and import with cryptographic token redaction and Zod schema validation.
- **PWA & Offline Viewing**: Service worker with automated build-time content-hash cache versioning and offline report exploration.

---

## Architecture

```
[ Browser Client ]
  ├── Next.js (App Router, React 19, TypeScript)
  ├── Web Worker (analyzer.worker.ts)
  │     ├── GitHub REST & GraphQL API Client (Direct HTTPS)
  │     ├── Concurrency Scheduler & Paging Engine
  │     └── Deterministic Normalization & Aggregation
  └── IndexedDB (Dexie.js Storage Layer)
        └── Cached Analyses, Checkpoints, and Sync Markers

[ Server Boundary (Authentication Only) ]
  └── Minimal Next.js Route Handlers
        ├── /api/auth/login     (PKCE Challenge & OAuth Redirect)
        ├── /api/auth/callback  (Server-Side Token Exchange)
        ├── /api/auth/session   (Session Cookie Proxy, No-Store)
        ├── /api/auth/logout    (Cookie Invalidation)
        └── /api/profile        (Bounded Memory Cache Proxy)
```

---

## Tech Stack

| Component | Technology |
|---|---|
| **Framework** | Next.js 16 (App Router, Turbopack), React 19, TypeScript |
| **Styling** | Tailwind CSS, Neobrutalist Design System |
| **Worker Engine** | Native Web Workers API |
| **Storage** | Dexie.js 4 (IndexedDB) |
| **Visualizations** | Apache ECharts |
| **Data Layer** | GitHub REST API v3, GitHub GraphQL API v4 |
| **Validation** | Zod |
| **Testing** | Vitest (Unit & Integration) |
| **Linting** | ESLint (Flat Config) + TypeScript Compiler |

---

## Documentation

Comprehensive technical specifications are available in the [docs/](docs/) directory:

- [Architecture Specification](docs/architecture.md): System topology, Web Worker processing pipeline, scheduling, and storage layers.
- [Privacy & Security Specification](docs/privacy-security.md): Local-first invariants, PKCE OAuth flow, and token redaction engine.
- [Analytics & Data Models](docs/analytics-model.md): Mathematical formulations, developer archetype criteria, and IndexedDB schemas.

---

## Getting Started

### Prerequisites

- Node.js 18.18 or higher
- pnpm (recommended) or npm / yarn
- A GitHub OAuth App (for authentication)

### 1. Clone the repository

```bash
git clone https://github.com/monojitgoswami69/gitopsy.git
cd gitopsy
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Configure environment variables

Create a `.env.local` file in the root directory:

```env
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_REDIRECT_URI=http://localhost:3000/api/auth/callback
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> **Note**: In your GitHub OAuth App settings, set the Authorization callback URL to `http://localhost:3000/api/auth/callback`.

### 4. Run the development server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Quality gates & production build

```bash
# Run unit & integration test suite (61 tests)
pnpm test

# Run ESLint and TypeScript compiler verification
pnpm lint

# Create production build with automated SW cache stamping
pnpm build
```

---

## Privacy & Security

Gitopsy enforces strict privacy standards:

1. **No External Database**: There is no server-side database (PostgreSQL, MongoDB, Supabase, Firebase, Redis, etc.). All report data lives locally in your browser's IndexedDB.
2. **Zero Telemetry**: No third-party trackers, analytics scripts, or session recordings.
3. **Pure Read-Only Operations**: Uses standard GitHub OAuth (`read:user repo`) to analyze profile and repository commit activity. Gitopsy strictly performs read operations and never creates, modifies, or deletes any repository content or code.
4. **Local Data Management**: All stored analyses, sync markers, and checkpoints can be exported, redacted, or permanently purged at any time.

---

## License

MIT License. See [LICENSE](LICENSE) for details.

