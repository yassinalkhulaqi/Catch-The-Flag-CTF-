"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { api } from "@/lib/api/client";
import { useDictionary } from "@/lib/i18n";
import { timeAgo } from "@/lib/utils";
import type { NotificationItem, Paginated } from "@/lib/types";

export function NotificationsCenter() {
  const copy = useDictionary();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[] | null>(null);
  const [error, setError] = useState(false);

  async function load() {
    setError(false);
    try {
      const res = await api.get<Paginated<NotificationItem>>("/me/notifications?per_page=8");
      setItems(res.data);
    } catch {
      setError(true);
      setItems([]);
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => {
          setOpen(true);
          void load();
        }}
      >
        {copy.notifications.open}
      </Button>
      <Sheet open={open} onClose={() => setOpen(false)} title={copy.notifications.title}>
        {error ? <p className="text-sm text-danger">{copy.errors.genericBody}</p> : null}
        {items === null ? <p className="text-sm text-muted">…</p> : null}
        {items && items.length === 0 && !error ? (
          <p className="text-sm text-muted">{copy.notifications.emptyBody}</p>
        ) : null}
        <ul className="space-y-3">
          {(items ?? []).map((item) => (
            <li key={item.id} className="border-b border-border pb-3">
              <p className="text-sm font-medium">{item.data.title}</p>
              {item.data.body ? <p className="text-sm text-muted">{item.data.body}</p> : null}
              <p className="font-mono text-[11px] text-faint">{timeAgo(item.created_at)}</p>
            </li>
          ))}
        </ul>
        <Link href="/notifications" className="mt-4 inline-block text-sm text-accent hover:underline" onClick={() => setOpen(false)}>
          {copy.notifications.title}
        </Link>
      </Sheet>
    </>
  );
}
