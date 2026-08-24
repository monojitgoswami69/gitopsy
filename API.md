# GITOPSY API SPECIFICATION

## 1. Next.js Server Routes (Authentication Boundary)

### `GET /api/auth/login`
- **Purpose**: Initiates GitHub App OAuth 2.0 PKCE flow.
- **Behavior**:
  1. Generates 64-char random `code_verifier` and SHA-256 `code_challenge`.
  2. Sets temporary `gitopsy_code_verifier` and `gitopsy_oauth_state` cookies.
  3. Redirects to `https://github.com/login/oauth/authorize`.

### `GET /api/auth/callback`
- **Purpose**: Receives authorization code from GitHub.
- **Behavior**:
  1. Validates `state` against cookie.
  2. Exchanges `code` + `code_verifier` + `client_secret` at `https://github.com/login/oauth/access_token`.
  3. Sets temporary session cookie `gitopsy_token_session`.
  4. Redirects browser to `/autopsy?auth_status=connected`.

### `GET /api/auth/session`
- **Purpose**: One-time token handover to client React in-memory store on page load.
- **Response**: `{ authenticated: true, token: "..." }` or `{ authenticated: false }`.

### `POST /api/auth/logout`
- **Purpose**: Disconnects active session and purges all cookies.

---

## 2. Direct Browser-to-GitHub Interactions

Executed directly from the Web Worker / Octokit client:
- `GET /user`: User profile metadata
- `GET /user/repos`: Repository list with affiliation and pagination
- `GET /repos/{owner}/{repo}/languages`: Language byte sizes
- `GET /repos/{owner}/{repo}/commits`: Author commit log with date filtering
- `GET /repos/{owner}/{repo}/commits/{sha}`: Commit additions/deletions/files changed
- `GET /repos/{owner}/{repo}/pulls`: Pull requests authored
- `GET /repos/{owner}/{repo}/issues`: Issues authored
- `GET /search/issues?q=reviewed-by:{user}`: Reviews authored count
- `POST /graphql`: GraphQL queries for `viewer.contributionsCollection`
