import { api } from "@/lib/api/client";
import type { NotificationItem, Paginated } from "@/lib/types";

export interface NotificationListParams {
  page?: number | string;
  per_page?: number | string;
}

export function toNotificationQueryString(
  params: NotificationListParams,
): string {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    qs.set(key, String(value));
  }
  return qs.toString();
}

/**
 * Browser-side notification helpers for the header bell and read-action
 * islands. All go through the same-origin BFF; null/false on ApiError
 * (never throws) so islands degrade gracefully.
 *
 * Lives in its own module (instead of lib/api/me.ts) because that file
 * imports next/headers via serverApi, which cannot ship to the browser.
 */

/** Small list fetch for the header bell island. */
export async function listNotificationsClient(
  params: NotificationListParams = {},
): Promise<Paginated<NotificationItem> | null> {
  try {
    const qs = toNotificationQueryString(params);
    return await api.get<Paginated<NotificationItem>>(
      `/me/notifications${qs ? `?${qs}` : ""}`,
    );
  } catch {
    return null;
  }
}

/** Mark one notification read. False on ApiError (never throws). */
export async function markNotificationRead(id: string): Promise<boolean> {
  try {
    await api.post(`/me/notifications/${encodeURIComponent(id)}/read`);
    return true;
  } catch {
    return false;
  }
}

/** Mark all notifications read. False on ApiError (never throws). */
export async function markAllNotificationsRead(): Promise<boolean> {
  try {
    await api.post("/me/notifications/read-all");
    return true;
  } catch {
    return false;
  }
}
