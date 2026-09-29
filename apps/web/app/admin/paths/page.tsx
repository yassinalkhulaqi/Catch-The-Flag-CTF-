import Link from "next/link";
import { DifficultyBadge } from "@/components/difficulty-badge";
import { EmptyState, ErrorState, PageHeader } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { requireStaff } from "@/lib/auth";
import { serverApi } from "@/lib/api/server";
import type { Paginated, PathSummary } from "@/lib/types";

export const metadata = { title: "Admin · Paths" };

export default async function AdminPathsPage() {
  await requireStaff();
  let items: PathSummary[] = [];
  let loadError = false;
  try {
    const res = await serverApi<Paginated<PathSummary>>("GET", "/admin/paths?per_page=50");
    items = res.data;
  } catch {
    loadError = true;
  }

  return (
    <div>
      <PageHeader
        eyebrow="Authoring"
        title="Paths"
        description="Learning path drafts and published curricula."
      />
      {loadError ? (
        <ErrorState />
      ) : items.length === 0 ? (
        <EmptyState title="No paths" />
      ) : (
        <ul className="divide-y divide-border border-t border-border">
          {items.map((p) => (
            <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
              <div className="space-y-1">
                <p className="font-semibold">{p.title}</p>
                <div className="flex flex-wrap items-center gap-2">
                  <DifficultyBadge difficulty={p.difficulty} />
                  <Badge>{p.status}</Badge>
                  <span className="font-mono text-xs text-faint">
                    {p.module_count} modules · {p.lesson_count} lessons
                  </span>
                </div>
              </div>
              <Link href={`/paths/${p.slug}`} className="text-sm text-accent hover:underline">
                View public
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
