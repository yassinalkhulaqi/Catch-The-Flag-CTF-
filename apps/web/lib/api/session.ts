import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ApiError } from "@/lib/api/client";
import { SESSION_COOKIE } from "@/lib/api/server";

/** Set the httpOnly session cookie (holds the Sanctum token — JS can't read it). */
export async function issueSession(token: string, expiresAt?: string): Promise<void> {
  const defaultTtl = Number(process.env.TOKEN_TTL_DAYS ?? 30) * 86_400;
  const ttl = expiresAt
    ? Math.max(60, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000))
    : defaultTtl;

  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ttl,
  });
}

/** Revoke nothing here — callers must revoke server-side first. */
export async function clearSession(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
}

/** Uniform error envelope passthrough (docs/api.md §1.1). */
export function errorResponse(error: unknown): NextResponse {
  if (error instanceof ApiError) {
    return NextResponse.json(
      {
        error: {
          code: error.code,
          message: error.message,
          ...(error.fields ? { fields: error.fields } : {}),
          ...(error.requestId ? { request_id: error.requestId } : {}),
        },
      },
      { status: error.status },
    );
  }
  return NextResponse.json(
    { error: { code: "server_error", message: "Something went wrong." } },
    { status: 500 },
  );
}

/** Parse JSON body → object or null. */
export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}
