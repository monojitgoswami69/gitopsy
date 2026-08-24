/**
 * PKCE (RFC 7636) & GitHub App OAuth 2.0 Utilities
 * Implements code_verifier, code_challenge (S256), and state validation.
 */

function base64UrlEncode(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = typeof btoa !== "undefined" ? btoa(binary) : Buffer.from(binary, "binary").toString("base64");
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

export function generateRandomString(length: number = 64): string {
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
  let text = "";
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const values = new Uint8Array(length);
    crypto.getRandomValues(values);
    for (let i = 0; i < length; i++) {
      text += possible[values[i] % possible.length];
    }
  } else {
    for (let i = 0; i < length; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
  }
  return text;
}

export async function generateCodeVerifier(length: number = 64): Promise<string> {
  return generateRandomString(Math.max(43, Math.min(128, length)));
}

export async function generateCodeChallenge(verifier: string): Promise<string> {
  if (typeof crypto !== "undefined" && crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    const digest = await crypto.subtle.digest("SHA-256", data);
    return base64UrlEncode(digest);
  }
  // Node fallback for server routes
  const nodeCrypto = await import("crypto");
  const hash = nodeCrypto.createHash("sha256").update(verifier).digest();
  return base64UrlEncode(hash);
}

export function generateOAuthState(): string {
  return generateRandomString(32);
}

export interface GitHubOAuthConfig {
  clientId: string;
  redirectUri: string;
  scope: string;
  allowSignup?: boolean;
}

export function buildGitHubAuthorizeUrl(
  config: GitHubOAuthConfig,
  options: { state: string; codeChallenge: string }
): string {
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    scope: config.scope || "read:user,repo",
    state: options.state,
    code_challenge: options.codeChallenge,
    code_challenge_method: "S256",
    allow_signup: String(config.allowSignup ?? true),
  });

  return `https://github.com/login/oauth/authorize?${params.toString()}`;
}
