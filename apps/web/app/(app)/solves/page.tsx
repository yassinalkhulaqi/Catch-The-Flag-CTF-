import Link from "next/link";
import { DifficultyBadge } from "@/components/difficulty-badge";
import { EmptyState, ErrorState, PageHeader } from "@/components/empty-state";
import { requireUser } from "@/lib/auth";
import { serverApi } from "@/lib/api/server";
import { dictionaryFor } from "@/lib/i18n/dictionary";
import { getLocale } from "@/lib/theme/locale";
import { formatXp, timeAgo } from "@/lib/utils";
import type { Paginated, SolveEntry } from "@/lib/types";

export const metadata = { title: "My solves" };

export default async function SolvesPage() {
  await requireUser();
  const copy = dictionaryFor(await getLocale());

  let solves: SolveEntry[] = [];
  let loadError = false;
  try {
    const res = await serverApi<Paginated<SolveEntry>>("GET", "/me/solves");
    solves = res.data;
  } catch {
    loadError = true;
  }

  return (
    <div>
      <PageHeader
        eyebrow="Account"
        title={copy.pages.solvesTitle}
        description={copy.pages.solvesBody}
      />
      {loadError ? (
        <ErrorState />
      ) : solves.length === 0 ? (
        <EmptyState
          title="No solves yet"
          description="Download a challenge file and hunt for the flag."
          action={
            <Link href="/challenges" className="text-sm text-accent hover:underline">
              Browse challenges
            </Link>
          }
        />
      ) : (
        <ul className="divide-y divide-border border-t border-border">
          {solves.map((s) => (
            <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
              <div className="space-y-1">
                <Link
                  href={`/challenges/${s.challenge.slug}`}
                  className="font-semibold text-foreground hover:text-accent"
                >
                  {s.challenge.title}
                </Link>
                <div className="flex flex-wrap items-center gap-2">
                  <DifficultyBadge difficulty={s.challenge.difficulty} />
                  <span className="font-mono text-xs text-faint">
                    {timeAgo(s.solved_at)} · {s.hints_used} hints
                  </span>
                </div>
              </div>
              <p className="font-mono text-sm text-accent">+{formatXp(s.points_awarded)}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
