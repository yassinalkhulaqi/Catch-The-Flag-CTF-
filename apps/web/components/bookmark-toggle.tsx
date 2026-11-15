"use client";

import { useEffect, useState } from "react";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  addBookmark,
  deleteBookmark,
  listBookmarks,
  type BookmarkTargetType,
} from "@/lib/api/bookmarks-client";

/**
 * Add/remove a bookmark on a challenge, lesson or path.
 *
 * Optional note is edited on the /bookmarks page, not here — this island is
 * deliberately one action.
 */
export function BookmarkToggle({
  type,
  id,
  className,
}: {
  type: BookmarkTargetType;
  id: number;
  className?: string;
}) {
  const [bookmarkId, setBookmarkId] = useState<number | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    listBookmarks()
      .then((items) => {
        if (alive) {
          setBookmarkId(items.find((item) => item.type === type && item.target?.id === id)?.id ?? null);
        }
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [type, id]);

  async function toggle() {
    if (pending) return;
    setPending(true);
    setError(null);
    try {
      if (bookmarkId !== null) {
        await deleteBookmark(bookmarkId);
        setBookmarkId(null);
      } else {
        const created = await addBookmark(type, id);
        setBookmarkId(created.id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update the bookmark.");
    } finally {
      setPending(false);
    }
  }

  return (
    <span className={className}>
      <Button
        type="button"
        variant={bookmarkId !== null ? "secondary" : "outline"}
        size="sm"
        onClick={() => void toggle()}
        disabled={pending}
        aria-pressed={bookmarkId !== null}
        title={bookmarkId !== null ? "Remove from bookmarks" : "Save to bookmarks"}
      >
        {bookmarkId !== null ? (
          <BookmarkCheck aria-hidden="true" className="size-4" />
        ) : (
          <Bookmark aria-hidden="true" className="size-4" />
        )}
        {bookmarkId !== null ? "Saved" : "Bookmark"}
      </Button>
      {error ? (
        <span role="alert" className="ms-2 text-xs text-danger">
          {error}
        </span>
      ) : null}
    </span>
  );
}
