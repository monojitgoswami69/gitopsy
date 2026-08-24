# GITOPSY PRIVACY MANIFESTO

## 1. Hard Privacy Invariants

Gitopsy was designed with an uncompromising architectural invariant: **Your repository data belongs to you and must never touch an application database.**

```
[User Browser] ──(Direct HTTPS)──> [GitHub API]
      │
      └───(Local-Only)───> [IndexedDB / Local Storage]
```

### Absolute Zero Policy:
- ❌ **NO** PostgreSQL, MySQL, MongoDB, or SQLite databases on servers
- ❌ **NO** Redis or Memcached server caches
- ❌ **NO** Supabase, Firebase, or cloud backend services
- ❌ **NO** Server-side repository processing or logging
- ❌ **NO** Third-party analytics (Google Analytics, Mixpanel, Segment)
- ❌ **NO** Tracking pixels or marketing SDKs
- ❌ **NO** Session replay tools (Hotjar, FullStory, LogRocket)
- ❌ **NO** Error reporting telemetry transmitting private code snippets

---

## 2. Server Boundary Declaration

The minimal Next.js server routes provided in Gitopsy act solely as an **OAuth & PKCE Authentication Boundary**:
1. `/api/auth/login`: Generates cryptographic PKCE code challenge and state.
2. `/api/auth/callback`: Exchanges authorization codes for user access tokens.
3. `/api/auth/session`: Transmits token to client-side memory on load.
4. `/api/auth/logout`: Clears session cookies.

**Under no circumstances does the server proxy repository requests, store repository names, inspect commit messages, or log developer code.**

---

## 3. Local Data Lifecycle & Ownership

- **Storage Location**: All examined metrics, vital signs, repository rosters, commit histories, and diagnoses are stored strictly inside your browser's `IndexedDB` database (`GitopsyForensicDB`).
- **Data Deletion**: You can permanently incinerate 100% of your local records at any time via the **Export & Data** room (`/autopsy/export`) with a single click.
- **Export Control**: Exported JSON files are deep-sanitized before generation, stripping all authentication credentials and secrets.
