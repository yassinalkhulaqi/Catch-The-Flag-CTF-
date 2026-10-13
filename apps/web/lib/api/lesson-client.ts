import { api } from "@/lib/api/client";

/**
 * Browser-side lesson completion for the MarkCompleteButton island.
 * POSTs through the same-origin BFF; returns null on ApiError (never throws)
 * so the island can render an inline message.
 *
 * Lives in its own module (instead of lib/api/lessons.ts) because that file
 * imports next/headers via serverApi, which cannot ship to the browser.
 */
export async function completeLesson(
  id: string | number,
): Promise<{ completed: boolean } | null> {
  try {
    const res = await api.post<{ data: { completed: boolean } }>(
      `/lessons/${encodeURIComponent(String(id))}/complete`,
    );
    return res.data ?? null;
  } catch {
    return null;
  }
}
