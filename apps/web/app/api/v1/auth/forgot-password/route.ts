import { NextResponse } from "next/server";
import { serverApi } from "@/lib/api/server";
import { errorResponse, readJson } from "@/lib/api/session";

/**
 * POST /api/v1/auth/forgot-password — BFF passthrough (no session needed).
 * Always 202 from Laravel; no account enumeration by design.
 */
export async function POST(request: Request): Promise<NextResponse> {
  try {
    await serverApi("POST", "/auth/forgot-password", {
      body: await readJson(request),
      token: null,
    });
    return NextResponse.json({ data: { sent: true } }, { status: 202 });
  } catch (error) {
    return errorResponse(error);
  }
}
