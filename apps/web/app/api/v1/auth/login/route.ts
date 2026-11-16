import { NextResponse } from "next/server";
import { forbiddenCrossOrigin, isSameOrigin } from "@/lib/bff-origin";
import { serverAuth } from "@/lib/api/server";
import { errorResponse, issueSession, readJson } from "@/lib/api/session";

/**
 * POST /api/v1/auth/login — BFF: forwards credentials to Laravel, stores the
 * returned token in an httpOnly cookie, and returns ONLY the user payload.
 */
export async function POST(request: Request): Promise<NextResponse> {
  if (!isSameOrigin(request)) {
    return forbiddenCrossOrigin();
  }

  const body = readJson(request);
  try {
    const userAgent = request.headers.get("user-agent") ?? undefined;
    const auth = await serverAuth(
      "/auth/login",
      await body,
      userAgent ? { "User-Agent": userAgent } : undefined,
    );
    if (!auth.token) {
      return NextResponse.json(
        { error: { code: "server_error", message: "Authentication token missing." } },
        { status: 500 },
      );
    }
    await issueSession(auth.token, auth.expires_at);
    return NextResponse.json({ data: { user: auth.user, expires_at: auth.expires_at } });
  } catch (error) {
    return errorResponse(error);
  }
}
