import { NextRequest, NextResponse } from "next/server";
import { generateCodeVerifier, generateCodeChallenge, generateOAuthState, buildGitHubAuthorizeUrl } from "@/lib/github/auth";

export async function GET(request: NextRequest) {
  const clientId = process.env.GITHUB_CLIENT_ID || process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;
  const redirectUri =
    process.env.GITHUB_REDIRECT_URI ||
    `${request.nextUrl.origin}/api/auth/callback`;

  if (!clientId) {
    // If no client ID configured in env, redirect to landing with error advisory
    return NextResponse.redirect(
      new URL("/?auth_error=GITHUB_CLIENT_ID_NOT_CONFIGURED", request.url)
    );
  }

  const verifier = await generateCodeVerifier(64);
  const challenge = await generateCodeChallenge(verifier);
  const state = generateOAuthState();

  const scope = process.env.GITHUB_SCOPES || "read:user";

  const authorizeUrl = buildGitHubAuthorizeUrl(
    {
      clientId,
      redirectUri,
      scope,
    },
    { state, codeChallenge: challenge }
  );

  const response = NextResponse.redirect(authorizeUrl);

  // Set secure HttpOnly cookies for PKCE verification
  response.cookies.set("gitopsy_code_verifier", verifier, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600, // 10 minutes
  });

  response.cookies.set("gitopsy_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });

  // Determine return_to destination (default to '/')
  let returnTo = request.nextUrl.searchParams.get("return_to");
  if (!returnTo) {
    const referer = request.headers.get("referer");
    if (referer) {
      try {
        const refUrl = new URL(referer);
        if (refUrl.origin === request.nextUrl.origin) {
          returnTo = refUrl.pathname + refUrl.search;
        }
      } catch {
        // ignore invalid referer header
      }
    }
  }

  if (!returnTo || !returnTo.startsWith("/") || returnTo.startsWith("//")) {
    returnTo = "/";
  }

  response.cookies.set("gitopsy_return_to", returnTo, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });

  return response;
}

