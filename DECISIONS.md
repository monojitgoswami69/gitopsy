# GITOPSY ARCHITECTURAL DECISION RECORDS (ADRs)

## ADR-001: Web Worker Offloading for Analysis Pipeline
- **Context**: Aggregating hundreds of repositories, commit trees, and generating mathematical scores on the main JavaScript thread causes noticeable UI jank and frames drops.
- **Decision**: All network fetching, pagination, metrics normalization, and score computations execute in a dedicated Web Worker (`analyzer.worker.ts`).
- **Consequences**: Main React UI remains responsive at 60fps; progress is streamed cleanly via Web Worker `postMessage`.

---

## ADR-002: In-Memory Token Management
- **Context**: Storing access tokens in `localStorage` or `IndexedDB` exposes tokens to XSS persistence and un-sanitized exports.
- **Decision**: Tokens are held exclusively in React / Zustand memory and temporary HttpOnly cookies. Disconnecting explicitly purges all memory structures and cookies.
- **Consequences**: Enhanced security posture aligned with GitHub App least-privilege standards.

---

## ADR-003: Deterministic Analytics vs. LLM Hallucinations
- **Context**: AI models frequently hallucinate non-existent commits or produce non-reproducible developer profiles.
- **Decision**: All classifications, metrics, awards, and findings are computed using deterministic mathematical algorithms and verifiable thresholds.
- **Consequences**: 100% testable, consistent, and provable analytics. Every card features a transparent "Why did you get this?" evidence drawer.

---

## ADR-004: Neobrutalism Design System
- **Context**: Traditional developer dashboards look sterile, corporate, and forgettable.
- **Decision**: Implement a high-contrast Neobrutalist design system with hard offset shadows (`4px 4px 0 0 #000`), thick black borders, vibrant semantic color accents, and tactile hover feedback.
- **Consequences**: A visually striking, memorable forensic aesthetic that feels like a serious investigative instrument built by an eccentric engineer.
