import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/api/server";

/**
 * BFF catch-all proxy: browser → Next.js (same-origin cookie auth) → Laravel.
 * Thin and mechanical — no business logic, no authorization decisions
 * (Laravel re-checks everything; see docs/architecture.md §6).
 */
const API_URL = process.env.API_URL ?? "http://localhost:8000";
const MUTATING = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function errorResponse(status: number, code: string, message: string, requestId?: string) {
  return NextResponse.json(
    { error: { code, message, request_id: requestId } },
    { status },
  );
}

/** Same-origin enforcement for state-changing requests (CSRF defense at BFF). */
function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true; // non-browser client (curl) — Laravel still enforces auth
  try {
    const originHost = new URL(origin).host;
    const host = request.headers.get("host");
    return originHost === host;
  } catch {
    return false;
  }
}

async function proxy(
  request: Request,
  ctx: { params: Promise<{ path: string[] }> },
): Promise<NextResponse> {
  const { path } = await ctx.params;
  const method = request.method.toUpperCase();

  if (MUTATING.has(method) && !isSameOrigin(request)) {
    return errorResponse(403, "forbidden", "Cross-origin request rejected.");
  }

  // Session token is read from the httpOnly cookie (never exposed to JS).
  const { cookies } = await import("next/headers");
  const token = (await cookies()).get(SESSION_COOKIE)?.value;

  const url = new URL(request.url);
  const target = `${API_URL}/api/v1/${path.map(encodeURIComponent).join("/")}${url.search}`;

  const headers = new Headers();
  headers.set("Accept", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let body: BodyInit | undefined;
  if (!["GET", "HEAD"].includes(method)) {
    const contentType = request.headers.get("content-type");
    if (contentType) headers.set("Content-Type", contentType);
    body = await request.arrayBuffer();
  }

  let res: Response;
  try {
    res = await fetch(target, { method, headers, body, cache: "no-store" });
  } catch {
    return errorResponse(500, "server_error", "Upstream service unavailable.");
  }

  const responseHeaders = new Headers();
  const contentType = res.headers.get("Content-Type");
  if (contentType) responseHeaders.set("Content-Type", contentType);
  else responseHeaders.set("Content-Type", "application/json");

  const disposition = res.headers.get("Content-Disposition");
  if (disposition) responseHeaders.set("Content-Disposition", disposition);

  const contentLength = res.headers.get("Content-Length");
  if (contentLength) responseHeaders.set("Content-Length", contentLength);

  const retryAfter = res.headers.get("Retry-After");
  if (retryAfter) responseHeaders.set("Retry-After", retryAfter);

  return new NextResponse(await res.arrayBuffer(), {
    status: res.status,
    headers: responseHeaders,
  });
}

export {
  proxy as GET,
  proxy as POST,
  proxy as PUT,
  proxy as PATCH,
  proxy as DELETE,
};
