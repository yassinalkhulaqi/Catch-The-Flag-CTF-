import { NextResponse } from "next/server";
import { ApiError } from "@/lib/api/client";
import { forbiddenCrossOrigin, isSameOrigin } from "@/lib/bff-origin";
import { serverApi } from "@/lib/api/server";
import { clearSession, errorResponse } from "@/lib/api/session";

async function revokeAndClear(request: Request, path: string): Promise<NextResponse> {
  if (!isSameOrigin(request)) {
    return forbiddenCrossOrigin();
  }

  try {
    await serverApi("POST", path);
  } catch (error) {
    // Already-invalid tokens must not block logout (cookie is cleared anyway).
    if (!(error instanceof ApiError)) return errorResponse(error);
  }
  await clearSession();
  return NextResponse.json({ data: { ok: true } });
}

/** POST /api/v1/auth/logout — revoke current token server-side + clear cookie. */
export async function POST(request: Request): Promise<NextResponse> {
  return revokeAndClear(request, "/auth/logout");
}

/** PUT /api/v1/auth/logout-all — revoke every token for this user. */
export async function PUT(request: Request): Promise<NextResponse> {
  return revokeAndClear(request, "/auth/logout-all");
}
