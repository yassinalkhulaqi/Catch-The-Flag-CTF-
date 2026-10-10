import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/** Page-only maintenance gate. API routes stay up so the BFF can still answer. */
export function proxy(request: NextRequest) {
  if (process.env.MAINTENANCE_MODE !== "true") return NextResponse.next();
  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/maintenance") || pathname.startsWith("/api")) return NextResponse.next();
  return NextResponse.redirect(new URL("/maintenance", request.url));
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
