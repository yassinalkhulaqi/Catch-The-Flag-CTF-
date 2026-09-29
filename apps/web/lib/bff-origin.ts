import { NextResponse } from "next/server";

/**
 * Shared Origin/Host check for mutating BFF routes (CSRF defense).
 * Mirrors the catch-all proxy policy in app/api/v1/[...path]/route.ts.
 */

export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true; // non-browser client — Laravel still enforces auth
  try {
    const originHost = new URL(origin).host;
    const host = request.headers.get("host");
    return originHost === host;
  } catch {
    return false;
  }
}

export function forbiddenCrossOrigin(): NextResponse {
  return NextResponse.json(
    { error: { code: "forbidden", message: "Cross-origin request rejected." } },
    { status: 403 },
  );
}
