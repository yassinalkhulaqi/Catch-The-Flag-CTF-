import { BookOpen, Clock3, Layers, Route } from "lucide-react";
import { EmptyState, ErrorState } from "@/components/empty-state";
import { PathCard } from "@/components/path-card";
import { Badge } from "@/components/ui/badge";
import { serverApi } from "@/lib/api/server";
import { dictionaryFor } from "@/lib/i18n/dictionary";
import { getLocale } from "@/lib/theme/locale";
import type { Paginated, PathSummary } from "@/lib/types";

export const metadata = {
  title: "Learning paths",
  description:
    "Guided cybersecurity curricula that move from theory to practice challenges across DFIR, malware, reverse engineering, crypto, and more.",
};

export default async function PathsPage() {
  const copy = dictionaryFor(await getLocale());
  let paths: PathSummary[] = [];
  let loadError = false;
  try {
    const res = await serverApi<Paginated<PathSummary>>("GET", "/paths?per_page=50");
    paths = res.data;
  } catch {
    loadError = true;
  }

  const totals = paths.reduce(
    (acc, path) => ({
      modules: acc.modules + path.module_count,
      lessons: acc.lessons + path.lesson_count,
      minutes: acc.minutes + path.estimated_minutes,
    }),
    { modules: 0, lessons: 0, minutes: 0 },
  );
  const stats = [
    { label: "Paths", value: paths.length, icon: Route },
    { label: "Modules", value: totals.modules, icon: Layers },
    { label: "Lessons", value: totals.lessons, icon: BookOpen },
    { label: "Hours", value: Math.round(totals.minutes / 60), icon: Clock3 },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <section className="relative overflow-hidden rounded-2xl border border-border bg-surface/60 p-6 sm:p-8">
        <div aria-hidden="true" className="aurora pointer-events-none absolute inset-0 opacity-60" />
        <div className="relative">
          <p className="type-eyebrow text-accent">Learn</p>
          <h1 className="type-title mt-2 max-w-2xl text-balance">{copy.pages.pathsTitle}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
            {copy.pages.pathsBody}
          </p>
          <dl className="mt-6 grid max-w-2xl grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-4">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="bg-surface px-4 py-3">
                  <dt className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wide text-faint">
                    <Icon aria-hidden="true" className="size-3 text-accent" />
                    {stat.label}
                  </dt>
                  <dd className="mt-1 font-display text-xl font-semibold tabular-nums">
                    {stat.value}
                  </dd>
                </div>
              );
            })}
          </dl>
        </div>
      </section>

      {loadError ? (
        <div className="mt-8">
          <ErrorState />
        </div>
      ) : paths.length === 0 ? (
        <div className="mt-8">
          <EmptyState title={copy.pages.pathsEmpty} description={copy.pages.pathsEmptyBody} />
        </div>
      ) : (
        <section className="mt-10" aria-labelledby="paths-heading">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 id="paths-heading" className="type-heading">
              All paths
            </h2>
            <Badge tone="neutral" className="normal-case">
              {paths.length} available
            </Badge>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {paths.map((path) => (
              <PathCard key={path.id} path={path} variant="tile" />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
