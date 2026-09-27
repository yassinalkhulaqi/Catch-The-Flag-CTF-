import { NextResponse } from "next/server";
import { ApiError } from "@/lib/api/client";
import { serverApi } from "@/lib/api/server";
import { clearSession, errorResponse } from "@/lib/api/session";

async function revokeAndClear(path: string): Promise<NextResponse> {
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
export async function POST(): Promise<NextResponse> {
  return revokeAndClear("/auth/logout");
}

/** PUT /api/v1/auth/logout-all — revoke every token for this user. */
export async function PUT(): Promise<NextResponse> {
  return revokeAndClear("/auth/logout-all");
}
