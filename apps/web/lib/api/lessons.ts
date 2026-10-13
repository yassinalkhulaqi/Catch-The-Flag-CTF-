import { serverApi } from "@/lib/api/server";
import type { Lesson } from "@/lib/types";

/**
 * Server-side lesson detail (lesson content + linked challenges + quiz stub
 * + prev/next ids). Returns null on ApiError so pages render an empty state
 * instead of throwing.
 */
export async function getLesson(
  id: string | number,
): Promise<Lesson | null> {
  try {
    const res = await serverApi<{ data: Lesson }>(
      "GET",
      `/lessons/${encodeURIComponent(String(id))}`,
    );
    return res.data ?? null;
  } catch {
    return null;
  }
}
