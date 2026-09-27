import { NextResponse } from "next/server";
import { serverAuth } from "@/lib/api/server";
import { errorResponse, issueSession, readJson } from "@/lib/api/session";
import type { AuthResponse } from "@/lib/types";

/** POST /api/v1/auth/register — create account, start session (BFF cookie). */
export async function POST(request: Request): Promise<NextResponse> {
  const body = readJson(request);
  try {
    const auth: AuthResponse = await serverAuth("/auth/register", await body);
    await issueSession(auth.token ?? "", auth.expires_at);
    const { token: _token, ...safe } = auth;
    return NextResponse.json({ data: safe }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
