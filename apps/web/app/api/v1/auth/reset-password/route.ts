import { NextResponse } from "next/server";
import { serverApi } from "@/lib/api/server";
import { errorResponse, readJson } from "@/lib/api/session";

/**
 * POST /api/v1/auth/reset-password — BFF passthrough (no session needed).
 * Consumes the single-use reset token server-side.
 */
export async function POST(request: Request): Promise<NextResponse> {
  try {
    await serverApi("POST", "/auth/reset-password", {
      body: await readJson(request),
      token: null,
    });
    return NextResponse.json({ data: { reset: true } });
  } catch (error) {
    return errorResponse(error);
  }
}
