import { requireUser } from "@/lib/auth";
import { BookmarkManager } from "@/components/bookmark-manager";

export const metadata = { title: "Bookmarks" };

export default async function BookmarksPage() {
  await requireUser();

  return (
    <div className="space-y-6">
      <div>
        <p className="type-eyebrow text-accent">Save for later</p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight">Bookmarks</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Challenges, lessons and paths you saved — with private notes. Notes never leave your account and are never visible to others.
        </p>
      </div>
      <BookmarkManager />
    </div>
  );
}
