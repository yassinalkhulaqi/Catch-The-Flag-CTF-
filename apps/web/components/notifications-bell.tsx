"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { listNotificationsClient } from "@/lib/api/notifications-client";

/**
 * Header notification bell island. Fetches a small page of notifications and
 * shows a dot when anything is unread. Any failure degrades to a plain link
 * (never throws, never blocks rendering).
 */
export function NotificationsBell() {
  const [hasUnread, setHasUnread] = useState(false);

  useEffect(() => {
    let cancelled = false;
    listNotificationsClient({ per_page: 10 }).then((res) => {
      if (cancelled || !res || !Array.isArray(res.data)) return;
      setHasUnread(res.data.some((n) => n.read_at === null));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Link
      href="/notifications"
      aria-label={
        hasUnread ? "Notifications (unread available)" : "Notifications"
      }
      className="relative rounded-md p-2 text-muted transition-colors hover:text-foreground"
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M6 9a6 6 0 1 1 12 0c0 5 2 6 2 6H4s2-1 2-6Zm4 10a2 2 0 0 0 4 0"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {hasUnread ? (
        <span
          aria-hidden="true"
          className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-accent"
        />
      ) : null}
    </Link>
  );
}
