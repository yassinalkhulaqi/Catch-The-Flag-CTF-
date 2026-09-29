import { NextResponse } from "next/server";
import { serverAuth } from "@/lib/api/server";
import { errorResponse, issueSession, readJson } from "@/lib/api/session";

/**
 * POST /api/v1/auth/login — BFF: forwards credentials to Laravel, stores the
 * returned token in an httpOnly cookie, and returns ONLY the user payload.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const body = readJson(request);
  try {
    const auth = await serverAuth("/auth/login", await body);
    await issueSession(auth.token ?? "", auth.expires_at);
    const { token, ...safe } = auth;
    void token;
    return NextResponse.json({ data: safe });
  } catch (error) {
    return errorResponse(error);
  }
}
