import type {
  AdminAuditEntry,
  AdminChallengeDetail,
  AdminChallengeRow,
  AdminFileMeta,
  AdminFlagRef,
  AdminHint,
  AdminPathRow,
  AdminUserRow,
} from "@/lib/api/admin";
import { serverApi } from "@/lib/api/server";
import type { AdminStats, Category, ContentStatus, Paginated } from "@/lib/types";

/**
 * Server-side admin helpers for `app/admin/*` Server Components.
 * Every helper swallows transport/auth errors and returns an empty-state
 * value (`[]`, `null`, zeroed counts) so pages NEVER throw — they render
 * graceful empty states when the backend is unavailable.
 */

export interface AdminList<T> {
  items: T[];
  total: number;
}

async function getList<T>(path: string): Promise<AdminList<T>> {
  try {
    const res = await serverApi<Paginated<T>>("GET", path);
    if (!Array.isArray(res.data)) return { items: [], total: 0 };
    const total =
      typeof res.meta?.total === "number" ? res.meta.total : res.data.length;
    return { items: res.data, total };
  } catch {
    return { items: [], total: 0 };
  }
}

async function getOne<T>(path: string): Promise<T | null> {
  try {
    const res = await serverApi<{ data: T }>("GET", path);
    return res.data ?? null;
  } catch {
    return null;
  }
}

/* ---------- challenges ---------- */

export function listAdminChallengesServer(params: {
  status?: string;
  q?: string;
  page?: number | string;
  per_page?: number | string;
} = {}): Promise<AdminList<AdminChallengeRow>> {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === "") continue;
    qs.set(key, String(value));
  }
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  return getList<AdminChallengeRow>(`/admin/challenges${suffix}`);
}

export function getAdminChallengeServer(
  id: string | number,
): Promise<AdminChallengeDetail | null> {
  return getOne<AdminChallengeDetail>(
    `/admin/challenges/${encodeURIComponent(String(id))}`,
  );
}

export async function listAdminChallengeFilesServer(
  id: string | number,
): Promise<AdminFileMeta[]> {
  try {
    const res = await serverApi<{ data: AdminFileMeta[] } | AdminFileMeta[]>(
      "GET",
      `/admin/challenges/${encodeURIComponent(String(id))}/files`,
    );
    const data = Array.isArray(res) ? res : res.data;
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export async function listAdminChallengeHintsServer(
  id: string | number,
): Promise<AdminHint[]> {
  try {
    const res = await serverApi<{ data: AdminHint[] } | AdminHint[]>(
      "GET",
      `/admin/challenges/${encodeURIComponent(String(id))}/hints`,
    );
    const data = Array.isArray(res) ? res : res.data;
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export async function listAdminChallengeFlagsServer(
  id: string | number,
): Promise<AdminFlagRef[]> {
  try {
    const res = await serverApi<{ data: AdminFlagRef[] } | AdminFlagRef[]>(
      "GET",
      `/admin/challenges/${encodeURIComponent(String(id))}/flags`,
    );
    const data = Array.isArray(res) ? res : res.data;
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

/* ---------- users / audit / paths ---------- */

export function listAdminUsersServer(params: {
  q?: string;
  page?: number | string;
  per_page?: number | string;
} = {}): Promise<AdminList<AdminUserRow>> {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === "") continue;
    qs.set(key, String(value));
  }
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  return getList<AdminUserRow>(`/admin/users${suffix}`);
}

export function listAdminAuditLogsServer(params: {
  action?: string;
  page?: number | string;
  per_page?: number | string;
} = {}): Promise<AdminList<AdminAuditEntry>> {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === "") continue;
    qs.set(key, String(value));
  }
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  return getList<AdminAuditEntry>(`/admin/audit-logs${suffix}`);
}

export function listAdminPathsServer(): Promise<AdminList<AdminPathRow>> {
  return getList<AdminPathRow>("/admin/paths?per_page=100");
}

export async function getCategoriesServer(): Promise<Category[]> {
  try {
    const res = await serverApi<{ data: Category[] }>("GET", "/categories");
    return Array.isArray(res.data) ? res.data : [];
  } catch {
    return [];
  }
}

/* ---------- dashboard ---------- */

export interface AdminDashboard {
  byStatus: Record<ContentStatus, number>;
  usersTotal: number;
  pathsTotal: number;
  recentAudit: AdminAuditEntry[];
}

const STATUSES: ContentStatus[] = ["draft", "review", "published", "archived"];

/**
 * Dashboard counters. Status totals use `per_page=1` meta reads so they stay
 * exact without transferring rows; every read degrades independently.
 */
export async function getAdminDashboardServer(): Promise<AdminDashboard> {
  const [statusLists, users, paths, audit] = await Promise.all([
    Promise.all(
      STATUSES.map((status) =>
        getList<AdminChallengeRow>(
          `/admin/challenges?status=${status}&per_page=1`,
        ),
      ),
    ),
    getList<AdminUserRow>("/admin/users?per_page=1"),
    getList<AdminPathRow>("/admin/paths?per_page=1"),
    getList<AdminAuditEntry>("/admin/audit-logs?per_page=5"),
  ]);

  const byStatus = {
    draft: 0,
    review: 0,
    published: 0,
    archived: 0,
  } satisfies Record<ContentStatus, number>;
  STATUSES.forEach((status, i) => {
    byStatus[status] = statusLists[i]?.total ?? 0;
  });

  return {
    byStatus,
    usersTotal: users.total,
    pathsTotal: paths.total,
    recentAudit: audit.items,
  };
}

/**
 * Counts from the real `/admin/stats` endpoint. Returns null when the
 * endpoint is unreachable, so the dashboard renders without it rather than
 * fabricating numbers.
 */
export async function getAdminStatsServer(): Promise<AdminStats | null> {
  try {
    const res = await serverApi<{ data: AdminStats }>("GET", "/admin/stats");
    return res.data ?? null;
  } catch {
    return null;
  }
}
