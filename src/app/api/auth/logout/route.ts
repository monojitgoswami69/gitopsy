import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ success: true, message: "Disconnected successfully." });
  response.cookies.delete("gitopsy_token_session");
  response.cookies.delete("gitopsy_code_verifier");
  response.cookies.delete("gitopsy_oauth_state");
  response.cookies.delete("gitopsy_return_to");
  return response;
}
