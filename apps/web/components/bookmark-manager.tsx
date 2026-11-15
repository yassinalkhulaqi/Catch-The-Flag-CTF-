"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Bookmark as BookmarkIcon, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label, Textarea } from "@/components/ui/input";
import {
  deleteBookmark,
  listBookmarks,
  updateBookmarkNote,
  type BookmarkItem,
  type BookmarkTargetType,
} from "@/lib/api/bookmarks-client";
import { timeAgo } from "@/lib/utils";

const GROUPS: Array<{ key: BookmarkTargetType; label: string; empty: string }> = [
  { key: "challenge", label: "Challenges", empty: "No challenge bookmarked yet." },
  { key: "lesson", label: "Lessons", empty: "No lesson bookmarked yet." },
  { key: "path", label: "Paths", empty: "No path bookmarked yet." },
];

function targetHref(item: BookmarkItem): string | null {
  if (!item.target) return null;
  switch (item.type) {
    case "challenge":
      return `/challenges/${item.target.slug}`;
    case "lesson":
      return `/lessons/${item.target.id}`;
    case "path":
      return `/paths/${item.target.slug}`;
  }
}

export function BookmarkManager() {
  const [items, setItems] = useState<BookmarkItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let alive = true;
    listBookmarks()
      .then((list) => {
        if (alive) setItems(list);
      })
      .catch((err) => {
        if (alive) setError(err instanceof Error ? err.message : "Could not load bookmarks.");
      });
    return () => {
      alive = false;
    };
  }, []);

  async function remove(item: BookmarkItem) {
    setPending(true);
    setError(null);
    try {
      await deleteBookmark(item.id);
      setItems((current) => current?.filter((entry) => entry.id !== item.id) ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove the bookmark.");
    } finally {
      setPending(false);
    }
  }

  async function saveNote(item: BookmarkItem, note: string | null) {
    setError(null);
    try {
      const updated = await updateBookmarkNote(item.id, note ?? null);
      setItems((current) => current?.map((entry) => (entry.id === item.id ? updated : entry)) ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the note.");
    }
  }

  if (items === null && error === null) {
    return <p className="text-sm text-muted">Loading bookmarks…</p>;
  }

  return (
    <div className="space-y-8">
      {error ? (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}
      {GROUPS.map((group) => {
        const members = (items ?? []).filter((item) => item.type === group.key);
        return (
          <section key={group.key} aria-labelledby={`bookmarks-${group.key}`}>
            <h2 id={`bookmarks-${group.key}`} className="type-eyebrow text-accent">
              {group.label} · {members.length}
            </h2>
            {members.length === 0 ? (
              <p className="mt-2 text-sm text-muted">{group.empty}</p>
            ) : (
              <ul className="mt-3 space-y-3">
                {members.map((item) => (
                  <BookmarkRow
                    key={item.id}
                    item={item}
                    onRemove={() => void remove(item)}
                    onSaveNote={(note) => void saveNote(item, note)}
                    pending={pending}
                  />
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}

function BookmarkRow({
  item,
  onRemove,
  onSaveNote,
  pending,
}: {
  item: BookmarkItem;
  onRemove: () => void;
  onSaveNote: (note: string | null) => void;
  pending: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draftNote, setDraftNote] = useState(item.note ?? "");

  const href = targetHref(item);

  return (
    <li className="rounded-lg border border-border bg-surface p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <BookmarkIcon aria-hidden="true" className="size-4 text-accent" />
            {href !== null && item.target ? (
              <Link href={href} className="font-medium text-foreground hover:text-accent">
                {item.target.title}
              </Link>
            ) : (
              <span className="font-medium text-foreground">{item.target?.title ?? "Target removed"}</span>
            )}
            {item.target?.difficulty ? (
              <Badge tone="neutral" className="normal-case">
                {item.target.difficulty}
              </Badge>
            ) : null}
            {item.target?.points ? (
              <span className="font-mono text-xs text-muted">{item.target.points} pts</span>
            ) : null}
            {item.created_at ? (
              <span className="font-mono text-[10px] text-faint">{timeAgo(item.created_at)}</span>
            ) : null}
          </div>
          {editing ? (
            <form
              className="mt-2"
              onSubmit={(event) => {
                event.preventDefault();
                onSaveNote(draftNote.trim() === "" ? null : draftNote.trim());
                setEditing(false);
              }}
            >
              <Label htmlFor={`note-${item.id}`} className="mb-1 block text-xs text-muted">
                Private note
              </Label>
              <Textarea
                id={`note-${item.id}`}
                rows={2}
                value={draftNote}
                onChange={(event) => setDraftNote(event.target.value)}
                placeholder="What should you remember about this?"
              />
              <div className="mt-2 flex gap-2">
                <Button type="submit" variant="secondary" size="sm">
                  Save note
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setDraftNote(item.note ?? "");
                    setEditing(false);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              className="mt-2 text-sm text-muted hover:text-foreground"
              onClick={() => setEditing(true)}
            >
              {item.note ? item.note : "Add a private note…"}
            </button>
          )}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onRemove}
          disabled={pending}
          aria-label="Remove bookmark"
        >
          <Trash2 aria-hidden="true" className="size-4" />
          Remove
        </Button>
      </div>
    </li>
  );
}
