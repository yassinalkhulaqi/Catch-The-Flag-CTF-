import { serverApi } from "@/lib/api/server";
import type { LeaderboardEntry, Paginated } from "@/lib/types";

/**
 * Server-side leaderboard fetch. Returns null on ApiError so pages can render
 * empty states instead of throwing (backend may be down in dev).
 */
export async function getLeaderboard(
  page = 1,
  perPage = 20,
): Promise<Paginated<LeaderboardEntry> | null> {
  const safePage = Number.isInteger(page) && page > 0 ? page : 1;
  const safePerPage =
    Number.isInteger(perPage) && perPage > 0 && perPage <= 100 ? perPage : 20;
  try {
    return await serverApi<Paginated<LeaderboardEntry>>(
      "GET",
      `/leaderboard?page=${safePage}&per_page=${safePerPage}`,
    );
  } catch {
    return null;
  }
}
