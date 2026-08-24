# GITOPSY DEVELOPER GUIDE

## 1. Prerequisites
- Node.js >= 20
- pnpm >= 9

---

## 2. Setup & Execution

```bash
# Navigate to the self-contained application
cd githulyzer

# Install dependencies (respecting clean supply-chain build policies)
pnpm install --ignore-scripts

# Start development server
pnpm dev

# Run Vitest test suite
pnpm test

# Build production bundle
pnpm build
```

---

## 3. Environment Variables (Optional for Local Auth)

Create a `.env.local` inside `githulyzer/` if you wish to configure live GitHub App credentials:

```env
GITHUB_CLIENT_ID=your_github_app_client_id
GITHUB_CLIENT_SECRET=your_github_app_client_secret
GITHUB_REDIRECT_URI=http://localhost:3000/api/auth/callback
```

*Note: Live credentials are completely optional. Gitopsy ships with a built-in multi-specimen **Demo Dossier Mode** allowing full exploration of all features, charts, awards, and court with zero configuration.*

---

## 4. Project Organization

```
githulyzer/
├── src/
│   ├── app/                 # Next.js App Router pages & API routes
│   ├── components/
│   │   ├── ui/              # Neobrutalist design primitives
│   │   ├── forensic/        # Specialized autopsy cards, court, wrapped, header
│   │   ├── charts/          # Apache ECharts containers & renderers
│   │   └── layout/          # Header, Floating Nav, Konami listener
│   ├── lib/
│   │   ├── github/          # Octokit, REST, GraphQL, Scheduler & Rate limiting
│   │   ├── db/              # Dexie IndexedDB & export/import
│   │   ├── analytics/       # Classifications, commit forensics, temporal, churn, awards, court
│   │   ├── store/           # Zustand stores (Auth, Autopsy, Preferences)
│   │   └── mock/            # Clean Demo Specimen dataset
│   ├── workers/             # Web Worker background analyzer
│   └── types/               # TypeScript domain models & Zod schemas
└── tests/
    ├── unit/                # Vitest unit test suites
    └── integration/         # Vitest integration test suites
```
