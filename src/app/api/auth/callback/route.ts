import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");
  const errorDescription = url.searchParams.get("error_description");

  const rawReturnTo = request.cookies.get("gitopsy_return_to")?.value || "/";
  const returnTo =
    rawReturnTo.startsWith("/") && !rawReturnTo.startsWith("//")
      ? rawReturnTo
      : "/";

  if (error) {
    const errorUrl = `${returnTo}${returnTo.includes("?") ? "&" : "?"}auth_error=${encodeURIComponent(errorDescription || error)}`;
    const response = NextResponse.redirect(new URL(errorUrl, request.url));
    response.cookies.delete("gitopsy_return_to");
    return response;
  }

  if (!code || !state) {
    const errorUrl = `${returnTo}${returnTo.includes("?") ? "&" : "?"}auth_error=MISSING_CODE_OR_STATE`;
    const response = NextResponse.redirect(new URL(errorUrl, request.url));
    response.cookies.delete("gitopsy_return_to");
    return response;
  }

  const savedState = request.cookies.get("gitopsy_oauth_state")?.value;
  const codeVerifier = request.cookies.get("gitopsy_code_verifier")?.value;

  if (!savedState || savedState !== state) {
    const errorUrl = `${returnTo}${returnTo.includes("?") ? "&" : "?"}auth_error=INVALID_OAUTH_STATE`;
    const response = NextResponse.redirect(new URL(errorUrl, request.url));
    response.cookies.delete("gitopsy_return_to");
    return response;
  }

  const clientId = process.env.GITHUB_CLIENT_ID || process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  const redirectUri =
    process.env.GITHUB_REDIRECT_URI || `${url.origin}/api/auth/callback`;

  try {
    const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        code_verifier: codeVerifier,
        redirect_uri: redirectUri,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error || !tokenData.access_token) {
      const errorUrl = `${returnTo}${returnTo.includes("?") ? "&" : "?"}auth_error=${encodeURIComponent(tokenData.error_description || tokenData.error || "Token exchange failed")}`;
      const response = NextResponse.redirect(new URL(errorUrl, request.url));
      response.cookies.delete("gitopsy_return_to");
      return response;
    }

    const successUrl = `${returnTo}${returnTo.includes("?") ? "&" : "?"}auth_status=connected`;
    const response = NextResponse.redirect(new URL(successUrl, request.url));

    // Store token in HttpOnly temporary session cookie for client in-memory retrieval
    response.cookies.set("gitopsy_token_session", tokenData.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 3600 * 8, // 8 hours
    });

    // Clean up PKCE and return_to cookies
    response.cookies.delete("gitopsy_code_verifier");
    response.cookies.delete("gitopsy_oauth_state");
    response.cookies.delete("gitopsy_return_to");

    return response;
  } catch (err) {
    const errorUrl = `${returnTo}${returnTo.includes("?") ? "&" : "?"}auth_error=${encodeURIComponent(String(err))}`;
    const response = NextResponse.redirect(new URL(errorUrl, request.url));
    response.cookies.delete("gitopsy_return_to");
    return response;
  }
}

