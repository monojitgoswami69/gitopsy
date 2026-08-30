import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const token = request.cookies.get("gitopsy_token_session")?.value;

  // The response body carries the raw access token (client-side analysis
  // requires it); never allow it to be cached by the browser or intermediaries.
  const noStoreHeaders = { "Cache-Control": "no-store" };

  if (!token) {
    return NextResponse.json(
      { authenticated: false, token: null },
      { status: 200, headers: noStoreHeaders }
    );
  }

  return NextResponse.json(
    {
      authenticated: true,
      token,
    },
    { headers: noStoreHeaders }
  );
}
