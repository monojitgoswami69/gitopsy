# Privacy & Security Specification

Gitopsy is designed with an uncompromising architectural principle: **your source code and repository data must never be stored on an external server**.

---

## 1. Privacy Invariants

### 1.1 Zero Server Storage
Gitopsy maintains an absolute zero policy regarding server-side user data:
- No application database (PostgreSQL, MySQL, MongoDB, SQLite).
- No cloud backend services (Supabase, Firebase, DynamoDB, Redis).
- No server-side repository processing, commit parsing, or diff logging.
- No repository names, commit messages, or diff files ever touch the server.

### 1.2 Zero Telemetry & Trackers
- No third-party tracking scripts (Google Analytics, Segment, Mixpanel, Amplitude).
- No session replay tools (Hotjar, FullStory, LogRocket).
- No telemetry SDKs transmitting environment or interaction data.

### 1.3 Local-First Execution
- All analysis logic runs exclusively within the user's browser via Web Workers.
- All persisted reports, checkpoints, and settings are stored locally in the browser's IndexedDB (`GitopsyForensicDB`).
- Users can clear all stored records at any time directly through the interface.

---

## 2. Authentication & Security Specification

### 2.1 OAuth 2.0 with PKCE (RFC 7636)
Authentication adheres strictly to GitHub App security guidelines:
1. **Cryptographic Verifier**: Client generates a 64-character high-entropy `code_verifier` and computes `code_challenge = Base64URL(SHA-256(code_verifier))`.
2. **State Parameter**: A cryptographically random 32-character `state` is generated per authorization attempt to prevent CSRF attacks.
3. **Cookie Security**: PKCE parameters and session tokens are set in `HttpOnly`, `SameSite=Lax`, `Secure` cookies with short expiration windows.
4. **No Code Injection**: The server verifies the `code_verifier` during token exchange, preventing authorization code interception.

### 2.2 Token Lifetime & Redaction
- **In-Memory Lifetime**: Tokens are held in active React/Zustand memory and temporary session cookies. They are never written to `localStorage` or `IndexedDB`.
- **Session Teardown**: Calling `/api/auth/logout` explicitly deletes all cookies and resets the in-memory Zustand store.
- **Export Redaction**: `ForensicDataSanitizer` recursively strips all tokens, authorization headers, and secrets before exporting JSON files.

### 2.3 HTTP Security Headers
Configured in `next.config.ts`:
- `X-Frame-Options: DENY` (prevents clickjacking)
- `X-Content-Type-Options: nosniff` (prevents MIME sniffing)
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`
