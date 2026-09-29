import { NextResponse } from "next/server";
import { forbiddenCrossOrigin, isSameOrigin } from "@/lib/bff-origin";
import { serverAuth } from "@/lib/api/server";
import { errorResponse, issueSession, readJson } from "@/lib/api/session";
import type { AuthResponse } from "@/lib/types";

/** POST /api/v1/auth/register — create account, start session (BFF cookie). */
export async function POST(request: Request): Promise<NextResponse> {
  if (!isSameOrigin(request)) {
    return forbiddenCrossOrigin();
  }

  const body = readJson(request);
  try {
    const auth: AuthResponse = await serverAuth("/auth/register", await body);
    if (!auth.token) {
      return NextResponse.json(
        { error: { code: "server_error", message: "Authentication token missing." } },
        { status: 500 },
      );
    }
    await issueSession(auth.token, auth.expires_at);
    const { token, ...safe } = auth;
    void token;
    return NextResponse.json({ data: safe }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
