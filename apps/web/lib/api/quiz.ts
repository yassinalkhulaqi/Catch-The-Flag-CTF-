import { serverApi } from "@/lib/api/server";
import type { Quiz } from "@/lib/types";

/**
 * Server-side quiz detail (questions WITHOUT is_correct flags).
 * Returns null on ApiError so the page renders an empty state (never throws).
 */
export async function getQuiz(id: string | number): Promise<Quiz | null> {
  try {
    const res = await serverApi<{ data: Quiz }>(
      "GET",
      `/quizzes/${encodeURIComponent(String(id))}`,
    );
    return res.data ?? null;
  } catch {
    return null;
  }
}
