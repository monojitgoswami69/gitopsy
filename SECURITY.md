# GITOPSY SECURITY AUDIT & SPECIFICATION

## 1. Authentication Security (OAuth 2.0 + PKCE)

Gitopsy adheres to the latest GitHub App security recommendations:
- **Proof Key for Code Exchange (PKCE - RFC 7636)**:
  - Client generates a 64-character high-entropy cryptographic `code_verifier`.
  - Computes `code_challenge = Base64URL(SHA256(code_verifier))`.
  - Verifier is stored in a temporary `HttpOnly`, `SameSite=Lax`, `Secure` cookie with a 10-minute expiration.
  - Server verifies `code_verifier` during token exchange, preventing authorization code injection and interception.
- **CSRF State Validation**:
  - Secure random 32-character `state` parameter generated per authorization attempt.
  - Validated strictly on callback before processing the authorization code.
- **Least-Privilege Scopes**:
  - Requests only `read:user` and `repo` (for private repository access if authorized by the user).

---

## 2. In-Memory Token Handling

- **No `localStorage` Persistence**: Access tokens are never stored in `localStorage` or `sessionStorage`.
- **No `IndexedDB` Token Persistence**: Access tokens are not stored in Dexie database tables.
- **No URL Leakage**: Tokens are never included in query parameters or hash fragments.
- **Session Purge on Disconnect**: Clicking **Disconnect** invokes `/api/auth/logout`, clearing all session cookies and resetting the in-memory Zustand store.

---

## 3. Data Sanitization & Export Auditing

- **Deep Redaction Engine (`ForensicDataSanitizer`)**:
  - Automatically recursively sanitizes JSON exports, redacting any key containing `token`, `secret`, `password`, `verifier`, `auth`, or `bearer`.
- **Zod Schema Verification**:
  - Imported JSON dossiers are strictly validated using Zod to prevent malformed or malicious payload injections.

---

## 4. HTTP Security Headers

Configured in `next.config.ts`:
- `X-Frame-Options: DENY` (Clickjacking defense)
- `X-Content-Type-Options: nosniff` (MIME sniffing prevention)
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`
