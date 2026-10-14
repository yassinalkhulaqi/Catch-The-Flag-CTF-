import { Suspense } from "react";
import { ChallengeCard } from "@/components/challenge-card";
import { ChallengeFilters } from "@/components/challenge-filters";
import { EmptyState, ErrorState, PageHeader } from "@/components/empty-state";
import { PaginationNav } from "@/components/pagination-nav";
import { Skeleton } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { serverApi } from "@/lib/api/server";
import { dictionaryFor } from "@/lib/i18n/dictionary";
import { getLocale } from "@/lib/theme/locale";
import { toQuery } from "@/lib/format";
import { TRACKS, normalizeTier, tierFor, trackForChallenge } from "@/lib/tracks";
import type { Category, ChallengeSummary, Paginated, Tag } from "@/lib/types";

export const metadata = {
  title: "Challenges",
  description:
    "Browse published static CTF challenges across SOC, DFIR, malware analysis, reverse engineering, cryptography, OSINT, and steganography.",
};

export default async function ChallengesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : undefined;
  const category = typeof sp.category === "string" ? sp.category : undefined;
  const difficulty = typeof sp.difficulty === "string" ? sp.difficulty : undefined;
  const tags = typeof sp.tags === "string" ? sp.tags : undefined;
  const solved = typeof sp.solved === "string" ? sp.solved : undefined;
  const sort = typeof sp.sort === "string" ? sp.sort : undefined;
  const minPoints = typeof sp.min_points === "string" ? sp.min_points : undefined;
  const maxPoints = typeof sp.max_points === "string" ? sp.max_points : undefined;
  const page = typeof sp.page === "string" ? sp.page : "1";
  const view = sp.view === "grid" ? "grid" : "list";
  // Presentation-only tier filter (no backend change): applied client-side
  // after fetch by mapping difficulty via tierFor().
  const tier = normalizeTier(typeof sp.tier === "string" ? sp.tier : null);
  const copy = dictionaryFor(await getLocale());

  let challenges: Paginated<ChallengeSummary> | null = null;
  let categories: Category[] = [];
  let allTags: Tag[] = [];
  let loadError = false;

  try {
    const [chRes, catRes, tagRes] = await Promise.all([
      serverApi<Paginated<ChallengeSummary>>(
        "GET",
        `/challenges${toQuery({ q, category, difficulty, tags, solved, sort, min_points: minPoints, max_points: maxPoints, page, per_page: 20 })}`,
      ),
      serverApi<{ data: Category[] }>("GET", "/categories"),
      serverApi<{ data: Tag[] }>("GET", "/tags"),
    ]);
    challenges = chRes;
    categories = catRes.data;
    allTags = tagRes.data;
  } catch {
    loadError = true;
  }

  function hrefForPage(nextPage: number) {
    return `/challenges${toQuery({
      q,
      category,
      difficulty,
      tags,
      solved,
      sort,
      min_points: minPoints,
      max_points: maxPoints,
      tier: tier ?? undefined,
      view: view === "grid" ? "grid" : undefined,
      page: nextPage > 1 ? nextPage : undefined,
    })}`;
  }

  const visible = challenges && tier ? challenges.data.filter((c) => tierFor(c.difficulty) === tier) : (challenges?.data ?? []);

  const trackStats = new Map<string, { total: number; solved: number }>();
  for (const track of TRACKS) trackStats.set(track.slug, { total: 0, solved: 0 });
  for (const c of visible) {
    const track = trackForChallenge(
      c.category.slug,
      c.tags.map((t) => t.slug),
    );
    const stat = trackStats.get(track.slug);
    if (!stat) continue;
    stat.total += 1;
    if (c.solved) stat.solved += 1;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <PageHeader
        eyebrow="CTF"
        title={copy.pages.challengesTitle}
        description={copy.pages.challengesBody}
      />

      <Suspense fallback={<Skeleton className="mb-6 h-40 w-full" />}>
        <ChallengeFilters categories={categories} tags={allTags} />
      </Suspense>

      <div className="mt-8">
        {loadError ? (
          <ErrorState description="Challenge list could not be loaded from the API." />
        ) : !challenges || visible.length === 0 ? (
          <EmptyState
            title={copy.pages.challengesEmpty}
            description={copy.pages.challengesEmptyBody}
          />
        ) : (
          <div>
            <section aria-label="Browse by vulnerability track" className="mb-8">
              <h2 className="mb-1 text-lg font-semibold text-foreground">
                Browse by track
              </h2>
              <p className="mb-4 text-sm text-muted">
                Vulnerability topics grouped from the listed challenges.
              </p>
              <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {TRACKS.map((track) => {
                  const stat = trackStats.get(track.slug) ?? { total: 0, solved: 0 };
                  return (
                    <li
                      key={track.slug}
                      className="rounded-xl border border-border bg-surface p-4"
                    >
                      <h3 className="text-sm font-semibold text-foreground">
                        {track.title}
                      </h3>
                      <p className="mt-1 min-h-10 text-xs text-muted">{track.blurb}</p>
                      <p className="mt-3 font-mono text-xs text-faint">
                        {stat.solved}/{stat.total} Solved
                      </p>
                      <Progress
                        value={stat.solved}
                        max={Math.max(1, stat.total)}
                        label={`${track.title} progress: ${stat.solved} of ${stat.total} solved`}
                        className="mt-2"
                      />
                    </li>
                  );
                })}
              </ul>
            </section>
            <p className="mb-2 font-mono text-xs text-faint">
              {tier ? visible.length : challenges.meta.total} challenge{(tier ? visible.length : challenges.meta.total) === 1 ? "" : "s"}
            </p>
            <div key={view} className={view === "grid" ? "grid animate-fade-up gap-3 sm:grid-cols-2" : "animate-fade-up border-t border-border"}>
              {visible.map((c) => (
                <ChallengeCard key={c.id} challenge={c} className={view === "grid" ? "rounded-xl border border-border px-4" : undefined} />
              ))}
            </div>
            <PaginationNav meta={challenges.meta} hrefForPage={hrefForPage} />
          </div>
        )}
      </div>
    </div>
  );
}
