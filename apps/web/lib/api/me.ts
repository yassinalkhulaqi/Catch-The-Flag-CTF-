import { serverApi } from "@/lib/api/server";
import type { NotificationItem, Paginated } from "@/lib/types";
import {
  toNotificationQueryString,
  type NotificationListParams,
} from "@/lib/api/notifications-client";

export type { NotificationListParams };

/**
 * Server-side notification list for the notifications page.
 * Returns null on ApiError so the page renders an empty state (never throws).
 */
export async function listNotifications(
  params: NotificationListParams = {},
): Promise<Paginated<NotificationItem> | null> {
  try {
    const qs = toNotificationQueryString(params);
    return await serverApi<Paginated<NotificationItem>>(
      "GET",
      `/me/notifications${qs ? `?${qs}` : ""}`,
    );
  } catch {
    return null;
  }
}
