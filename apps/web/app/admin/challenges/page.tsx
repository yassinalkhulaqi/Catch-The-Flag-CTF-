import Link from "next/link";
import { DifficultyBadge } from "@/components/difficulty-badge";
import { EmptyState, ErrorState, PageHeader } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { requireStaff } from "@/lib/auth";
import { serverApi } from "@/lib/api/server";
import { cn, formatXp } from "@/lib/utils";
import type { ChallengeSummary, Paginated } from "@/lib/types";

export const metadata = { title: "Admin · Challenges" };

export default async function AdminChallengesPage() {
  await requireStaff();

  let items: ChallengeSummary[] = [];
  let loadError = false;
  try {
    const res = await serverApi<Paginated<ChallengeSummary>>(
      "GET",
      "/admin/challenges?per_page=50",
    );
    items = res.data;
  } catch {
    loadError = true;
  }

  return (
    <div>
      <PageHeader
        eyebrow="Authoring"
        title="Challenges"
        description="Create, edit, and publish static challenges."
        actions={
          <Link href="/admin/challenges/new" className={cn(buttonVariants("primary", "sm"))}>
            New challenge
          </Link>
        }
      />
      {loadError ? (
        <ErrorState />
      ) : items.length === 0 ? (
        <EmptyState title="No challenges" />
      ) : (
        <ul className="divide-y divide-border border-t border-border">
          {items.map((c) => (
            <li key={c.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
              <div className="space-y-1">
                <Link
                  href={`/admin/challenges/${c.id}/edit`}
                  className="font-semibold hover:text-accent"
                >
                  {c.title}
                </Link>
                <div className="flex flex-wrap items-center gap-2">
                  <DifficultyBadge difficulty={c.difficulty} />
                  <Badge>{c.status}</Badge>
                  <span className="font-mono text-xs text-faint">
                    {c.category.name} · {formatXp(c.points)} pts
                  </span>
                </div>
              </div>
              <Link
                href={`/admin/challenges/${c.id}/edit`}
                className={cn(buttonVariants("outline", "sm"))}
              >
                Edit
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
