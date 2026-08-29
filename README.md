# Gitopsy

A local-first, privacy-focused GitHub analytics engine built with Next.js, Web Workers, and IndexedDB.

Gitopsy analyzes your version control patterns, 24-hour UTC commit distributions, code churn, and workflow archetypes using deterministic calculations directly in your browser.

---

## Highlights

- **Local-First Processing**: Analysis, aggregation, and caching run entirely in the browser using a dedicated Web Worker and IndexedDB. Repository code and commit histories are never stored on an external server.
- **24-Hour Temporal Analysis**: Visualizes 24-hour UTC commit clocks, weekday activity distributions, active streak lengths, and nocturnal commit ratios derived directly from author timestamps.
- **Commit Forensics & Code Churn**: Categorizes commit intent (feat, fix, refactor, chore), measures historical line additions and deletions, and analyzes commit size distributions.
- **Deterministic Archetypes**: Classifies workflow habits (such as Night Owl, Weekend Warrior, Polyglot, Refactor Specialist) with explicit, rule-based evidence criteria.
- **Interactive Reports & Summary**: Generates structured forensic reports and an interactive year-in-review breakdown.
- **GitHub OAuth with PKCE**: Uses read-only OAuth with cryptographic PKCE verification. Access tokens are kept in session memory and never stored in persistent databases.

---

## Architecture

```
[ Browser Client ]
  ├── Next.js (App Router, React 19, TypeScript)
  ├── Web Worker (analyzer.worker.ts)
  │     ├── GitHub REST & GraphQL API Client (Direct HTTPS)
  │     ├── Rate-Limit Scheduler & Paging Engine
  │     └── Deterministic Analytics Normalization
  └── IndexedDB (Dexie.js Storage Layer)
        └── Cached Reports, Checkpoints & Analysis Results

[ Server Boundary ]
  └── Minimal Next.js Route Handlers
        ├── /api/auth/login     (PKCE Challenge & GitHub OAuth Redirect)
        ├── /api/auth/callback  (Token Exchange)
        ├── /api/auth/session   (Session Verification)
        ├── /api/auth/logout    (Cookie Invalidation)
        └── /api/profile        (Basic Profile Retrieval)
```

---

## Tech Stack

| Component | Technology |
|---|---|
| **Framework** | Next.js (App Router), React 19, TypeScript |
| **Styling** | Tailwind CSS, Neo-Brutalism Design Tokens |
| **Concurrency** | Dedicated Web Workers API |
| **Storage** | Dexie.js (IndexedDB) |
| **Visualizations** | Apache ECharts |
| **Data Layer** | Octokit, GitHub REST API v3, GitHub GraphQL API v4 |
| **Validation** | Zod |
| **Testing** | Vitest, Playwright |

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

### 5. Run tests & production build

```bash
# Run unit tests
pnpm test

# Create production build
pnpm build
```

---

## Privacy & Security

Gitopsy enforces strict privacy standards:

1. **No External Database**: There is no server-side database (PostgreSQL, MongoDB, Supabase, Firebase, etc.). All report data lives locally in your browser's IndexedDB.
2. **Zero Telemetry**: No third-party trackers, analytics scripts, or session recordings.
3. **Read-Only Scopes**: Only requests `read:user` scope by default. Gitopsy never asks for write permissions to your repositories.
4. **Local Data Management**: All local reports can be exported or permanently deleted at any time directly from the interface.

---

## License

MIT License. See [LICENSE](LICENSE) for details.
