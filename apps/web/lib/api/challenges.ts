import { serverApi } from "@/lib/api/server";
import type {
  ChallengeDetail,
  ChallengeSummary,
  Paginated,
} from "@/lib/types";

export interface ChallengeListParams {
  q?: string;
  category?: string;
  difficulty?: string;
  tags?: string;
  min_points?: number | string;
  max_points?: number | string;
  solved?: boolean | string;
  sort?: string;
  page?: number | string;
  per_page?: number | string;
}

function toQueryString(params: ChallengeListParams): string {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    qs.set(key, String(value));
  }
  return qs.toString();
}

/**
 * Server-side challenge list. Returns [] on ApiError so pages can render
 * empty states instead of throwing (backend may be down in dev).
 */
export async function listChallenges(
  params: ChallengeListParams = {},
): Promise<ChallengeSummary[]> {
  try {
    const qs = toQueryString(params);
    const res = await serverApi<Paginated<ChallengeSummary>>(
      "GET",
      `/challenges${qs ? `?${qs}` : ""}`,
    );
    return res.data;
  } catch {
    return [];
  }
}

/** Server-side challenge detail. Returns null on ApiError (never throws). */
export async function getChallenge(
  slugOrId: string | number,
): Promise<ChallengeDetail | null> {
  try {
    const res = await serverApi<{ data: ChallengeDetail }>(
      "GET",
      `/challenges/${encodeURIComponent(String(slugOrId))}`,
    );
    return res.data;
  } catch {
    return null;
  }
}
