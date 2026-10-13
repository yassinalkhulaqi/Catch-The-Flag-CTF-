import { serverApi } from "@/lib/api/server";
import type {
  ModuleDetail,
  Paginated,
  PathDetail,
  PathSummary,
} from "@/lib/types";

export interface PathListParams {
  q?: string;
  category?: string;
  difficulty?: string;
  progress?: string;
  sort?: string;
  page?: number | string;
  per_page?: number | string;
}

function toQueryString(params: PathListParams): string {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    qs.set(key, String(value));
  }
  return qs.toString();
}

/**
 * Server-side path list. Returns [] on ApiError so pages can render
 * empty states instead of throwing (backend may be down in dev).
 */
export async function listPaths(
  params: PathListParams = {},
): Promise<PathSummary[]> {
  try {
    const qs = toQueryString(params);
    const res = await serverApi<Paginated<PathSummary>>(
      "GET",
      `/paths${qs ? `?${qs}` : ""}`,
    );
    return res.data;
  } catch {
    return [];
  }
}

/** Server-side path detail. Returns null on ApiError (never throws). */
export async function getPath(
  slugOrId: string | number,
): Promise<PathDetail | null> {
  try {
    const res = await serverApi<{ data: PathDetail }>(
      "GET",
      `/paths/${encodeURIComponent(String(slugOrId))}`,
    );
    return res.data;
  } catch {
    return null;
  }
}

/**
 * Best-effort module detail (ordered lessons + linked challenges).
 * The endpoint is auth-gated, so this returns null for logged-out users
 * or when the backend is unavailable — callers degrade to module counts.
 */
export async function getModuleDetail(
  id: number,
): Promise<ModuleDetail | null> {
  try {
    const res = await serverApi<{ data: ModuleDetail }>(
      "GET",
      `/modules/${id}`,
    );
    return res.data;
  } catch {
    return null;
  }
}
