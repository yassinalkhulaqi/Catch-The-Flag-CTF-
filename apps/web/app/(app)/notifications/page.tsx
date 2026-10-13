import type { Metadata } from "next";
import Link from "next/link";
import {
  MarkAllReadButton,
  MarkReadButton,
} from "@/components/notifications-buttons";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { listNotifications } from "@/lib/api/me";
import { cn, timeAgo } from "@/lib/utils";

export const metadata: Metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  const page = await listNotifications({ per_page: 20 });
  const items = page?.data ?? [];
  const unreadCount = items.filter((n) => n.read_at === null).length;

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Notifications
          </h1>
          <p className="mt-1 text-muted" aria-live="polite">
            {items.length === 0
              ? "Your inbox for achievements, solves, and updates."
              : unreadCount > 0
                ? `${unreadCount} unread of ${page?.meta.total ?? items.length}.`
                : "You're all caught up."}
          </p>
        </div>
        {items.length > 0 ? (
          <MarkAllReadButton disabled={unreadCount === 0} />
        ) : null}
      </div>

      {page === null ? (
        <Card className="mt-6">
          <CardTitle>Couldn&apos;t load notifications</CardTitle>
          <CardDescription className="mt-2">
            The backend may be unavailable. Try again later.
          </CardDescription>
        </Card>
      ) : items.length === 0 ? (
        <Card className="mt-6">
          <CardTitle>No notifications</CardTitle>
          <CardDescription className="mt-2">
            Achievements, solve confirmations, and announcements will show up
            here.
          </CardDescription>
        </Card>
      ) : (
        <ul className="mt-6 space-y-3">
          {items.map((n) => {
            const unread = n.read_at === null;
            return (
              <li key={n.id}>
                <Card
                  className={cn(
                    unread && "border-accent/40 bg-surface-raised",
                  )}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-foreground">
                        {unread ? (
                          <span
                            aria-hidden="true"
                            className="h-2 w-2 rounded-full bg-accent"
                          />
                        ) : null}
                        {n.data.title}
                        {unread ? (
                          <Badge tone="accent">Unread</Badge>
                        ) : null}
                      </p>
                      {n.data.body ? (
                        <p className="mt-1 text-sm text-muted">{n.data.body}</p>
                      ) : null}
                      <p className="mt-2 font-mono text-xs text-faint">
                        {n.type} · {timeAgo(n.created_at)}
                      </p>
                      {n.data.url ? (
                        <p className="mt-2">
                          <Link
                            href={n.data.url}
                            className="text-sm text-accent hover:underline"
                          >
                            View details
                          </Link>
                        </p>
                      ) : null}
                    </div>
                    {unread ? (
                      <MarkReadButton notificationId={n.id} />
                    ) : null}
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
