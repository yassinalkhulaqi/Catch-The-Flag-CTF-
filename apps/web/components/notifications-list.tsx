"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { api } from "@/lib/api/client";
import type { NotificationItem } from "@/lib/types";
import { cn, timeAgo } from "@/lib/utils";

export function NotificationsList({ items }: { items: NotificationItem[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  if (items.length === 0) {
    return (
      <EmptyState
        title="No notifications yet"
        description="Solves and achievement unlocks will show up here."
      />
    );
  }

  function markAllRead() {
    startTransition(async () => {
      await api.post("/me/notifications/read-all");
      router.refresh();
    });
  }

  function markRead(id: string) {
    startTransition(async () => {
      await api.post(`/me/notifications/${id}/read`);
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button type="button" variant="ghost" size="sm" disabled={pending} onClick={markAllRead}>
          Mark all read
        </Button>
      </div>
      <ul className="divide-y divide-border border-t border-border" aria-label="Notifications">
        {items.map((n) => {
          const unread = n.read_at === null;
          const inner = (
            <>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className={cn("text-sm", unread ? "font-semibold text-foreground" : "text-muted")}>
                    {n.data?.title ?? n.type}
                  </p>
                  {n.data?.body ? <p className="mt-1 text-sm text-muted">{n.data.body}</p> : null}
                </div>
                <time className="shrink-0 font-mono text-[11px] text-muted" dateTime={n.created_at}>
                  {timeAgo(n.created_at)}
                </time>
              </div>
            </>
          );

          return (
            <li key={n.id} className="py-4">
              {n.data?.url ? (
                <Link
                  href={n.data.url}
                  className="block hover:bg-surface-raised/40"
                  onClick={() => {
                    if (unread) markRead(n.id);
                  }}
                >
                  {inner}
                </Link>
              ) : (
                <button
                  type="button"
                  className="block w-full text-left"
                  onClick={() => {
                    if (unread) markRead(n.id);
                  }}
                >
                  {inner}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
