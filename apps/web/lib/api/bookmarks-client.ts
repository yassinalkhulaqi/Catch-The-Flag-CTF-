import { api } from "@/lib/api/client";

export interface BookmarkItem {
  id: number;
  type: "challenge" | "lesson" | "path";
  note: string | null;
  created_at: string | null;
  target: {
    id: number;
    slug?: string;
    title: string;
    difficulty?: string;
    points?: number;
    estimated_minutes?: number;
  } | null;
}

export type BookmarkTargetType = "challenge" | "lesson" | "path";

/** Pass through to `/api/v1/me/bookmarks`. Rethrows on failure (islands catch). */
export async function listBookmarks(): Promise<BookmarkItem[]> {
  const res = await api.get<{ data: BookmarkItem[] }>("/me/bookmarks");
  return res.data;
}

export async function addBookmark(
  type: BookmarkTargetType,
  id: number,
  note?: string | null,
): Promise<BookmarkItem> {
  const res = await api.post<{ data: BookmarkItem }>("/me/bookmarks", {
    type,
    id,
    note: note ?? null,
  });
  return res.data;
}

export async function updateBookmarkNote(
  id: number,
  note: string | null,
): Promise<BookmarkItem> {
  const res = await api.patch<{ data: BookmarkItem }>(`/me/bookmarks/${id}`, { note });
  return res.data;
}

export async function deleteBookmark(id: number): Promise<void> {
  await api.delete(`/me/bookmarks/${id}`);
}
