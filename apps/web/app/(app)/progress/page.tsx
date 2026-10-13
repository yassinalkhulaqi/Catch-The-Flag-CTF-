import Link from "next/link";
import { EmptyState, ErrorState, PageHeader } from "@/components/empty-state";
import { PathCard } from "@/components/path-card";
import { requireUser } from "@/lib/auth";
import { serverApi } from "@/lib/api/server";
import { dictionaryFor } from "@/lib/i18n/dictionary";
import { getLocale } from "@/lib/theme/locale";
import { formatXp } from "@/lib/utils";
import type { Paginated, PathSummary, ProgressOverview, XpEntry } from "@/lib/types";

export const metadata = { title: "My progress" };

export default async function ProgressPage() {
  await requireUser();
  const copy = dictionaryFor(await getLocale());

  let overview: ProgressOverview | null = null;
  let paths: PathSummary[] = [];
  let ledger: XpEntry[] = [];
  let loadError = false;

  try {
    const [prog, pathRes, xpRes] = await Promise.all([
      serverApi<{ data: ProgressOverview }>("GET", "/me/progress"),
      serverApi<Paginated<PathSummary>>("GET", "/paths?per_page=50"),
      serverApi<Paginated<XpEntry>>("GET", "/me/xp-ledger?per_page=10"),
    ]);
    overview = prog.data;
    paths = pathRes.data.filter((p) => p.progress_percent > 0);
    ledger = xpRes.data;
  } catch {
    loadError = true;
  }

  return (
    <div>
      <PageHeader
        eyebrow="Account"
        title={copy.pages.progressTitle}
        description={copy.pages.progressBody}
      />

      {loadError ? (
        <ErrorState />
      ) : (
        <>
          {overview ? (
            <div className="mb-8 grid gap-3 sm:grid-cols-3">
              <Stat label="XP" value={formatXp(overview.xp)} />
              <Stat label="Lessons done" value={String(overview.lessons_completed)} />
              <Stat label="Paths completed" value={String(overview.paths_completed)} />
            </div>
          ) : null}

          <section className="mb-10" aria-labelledby="paths-progress">
            <h2
              id="paths-progress"
              className="mb-3 font-mono text-xs uppercase tracking-[0.16em] text-accent"
            >
              Started paths
            </h2>
            {paths.length === 0 ? (
              <EmptyState
                title="No paths started"
                description="Pick a learning path to begin."
                action={
                  <Link href="/paths" className="text-sm text-accent hover:underline">
                    Browse paths
                  </Link>
                }
              />
            ) : (
              <div className="border-t border-border">
                {paths.map((p) => (
                  <PathCard key={p.id} path={p} />
                ))}
              </div>
            )}
          </section>

          <section aria-labelledby="xp-heading">
            <h2
              id="xp-heading"
              className="mb-3 font-mono text-xs uppercase tracking-[0.16em] text-accent"
            >
              XP ledger
            </h2>
            {ledger.length === 0 ? (
              <p className="text-sm text-muted">No XP transactions yet.</p>
            ) : (
              <ul className="divide-y divide-border border border-border">
                {ledger.map((row) => (
                  <li key={row.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                    <div>
                      <p className="text-foreground">{row.description || row.reason}</p>
                      <p className="font-mono text-xs text-faint">
                        {new Date(row.created_at).toLocaleString()}
                      </p>
                    </div>
                    <span className="font-mono text-accent">+{formatXp(row.amount)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-border bg-surface p-4">
      <p className="font-mono text-[11px] uppercase text-muted">{label}</p>
      <p className="mt-1 font-display text-xl font-semibold">{value}</p>
    </div>
  );
}
