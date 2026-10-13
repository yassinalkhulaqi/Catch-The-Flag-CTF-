"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/api/notifications-client";

/** "Mark all as read" island for the notifications page. */
export function MarkAllReadButton({ disabled }: { disabled: boolean }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function markAll() {
    setPending(true);
    setError(null);
    const ok = await markAllNotificationsRead();
    setPending(false);
    if (ok) {
      router.refresh();
    } else {
      setError("Could not mark notifications as read. Try again later.");
    }
  }

  return (
    <div className="space-y-2">
      <Button
        variant="outline"
        size="sm"
        onClick={markAll}
        disabled={disabled || pending}
      >
        {pending ? "Saving…" : "Mark all as read"}
      </Button>
      {error ? (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/** Per-item "mark as read" island for the notifications page. */
export function MarkReadButton({ notificationId }: { notificationId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function markRead() {
    setPending(true);
    setError(null);
    const ok = await markNotificationRead(notificationId);
    setPending(false);
    if (ok) {
      router.refresh();
    } else {
      setError("Could not mark this notification as read.");
    }
  }

  return (
    <div className="space-y-1">
      <Button variant="ghost" size="sm" onClick={markRead} disabled={pending}>
        {pending ? "Saving…" : "Mark as read"}
      </Button>
      {error ? (
        <p role="alert" className="text-xs text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
