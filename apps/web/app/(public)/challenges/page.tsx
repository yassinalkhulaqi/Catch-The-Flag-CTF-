import { Suspense } from "react";
import { ActiveFilters, type ActiveFilter } from "@/components/active-filters";
import { ChallengeCard } from "@/components/challenge-card";
import { ChallengeFilters } from "@/components/challenge-filters";
import { ChallengeTracks } from "@/components/challenge-tracks";
import { EmptyState, ErrorState, PageHeader } from "@/components/empty-state";
import { PaginationNav } from "@/components/pagination-nav";
import { Skeleton } from "@/components/ui/badge";
import { serverApi } from "@/lib/api/server";
import { dictionaryFor } from "@/lib/i18n/dictionary";
import { getLocale } from "@/lib/theme/locale";
import { difficultyLabel, toQuery } from "@/lib/format";
import { TIER_LABELS, normalizeTier, tierFor } from "@/lib/tracks";
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

  const currentParams: Record<string, string | undefined> = {
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
  };

  function removeFilter(key: string): string {
    const next = { ...currentParams };
    delete next[key];
    return `/challenges${toQuery(next)}`;
  }

  const sortLabels: Record<string, string> = {
    "-points": "points, high to low",
    points: "points, low to high",
    "-created_at": "newest first",
  };

  const activeFilters: ActiveFilter[] = [];
  if (q) activeFilters.push({ key: "q", label: `Search: ${q}`, href: removeFilter("q") });
  if (category) {
    const name = categories.find((item) => item.slug === category)?.name ?? category;
    activeFilters.push({ key: "category", label: `Category: ${name}`, href: removeFilter("category") });
  }
  if (difficulty) {
    activeFilters.push({
      key: "difficulty",
      label: `Difficulty: ${difficultyLabel(difficulty)}`,
      href: removeFilter("difficulty"),
    });
  }
  if (tags) {
    const name = allTags.find((item) => item.slug === tags)?.name ?? tags;
    activeFilters.push({ key: "tags", label: `Tag: ${name}`, href: removeFilter("tags") });
  }
  if (tier) {
    activeFilters.push({ key: "tier", label: `Tier: ${TIER_LABELS[tier]}`, href: removeFilter("tier") });
  }
  if (solved) activeFilters.push({ key: "solved", label: "Solved only", href: removeFilter("solved") });
  if (minPoints) activeFilters.push({ key: "min_points", label: `Min ${minPoints} pts`, href: removeFilter("min_points") });
  if (maxPoints) activeFilters.push({ key: "max_points", label: `Max ${maxPoints} pts`, href: removeFilter("max_points") });
  if (sort) activeFilters.push({ key: "sort", label: `Sort: ${sortLabels[sort] ?? sort}`, href: removeFilter("sort") });

  const clearHref = `/challenges${toQuery({
    view: view === "grid" ? "grid" : undefined,
  })}`;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <PageHeader
        eyebrow="Catalog // CTF"
        title={copy.pages.challengesTitle}
        description={copy.pages.challengesBody}
        actions={
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-raised/60 px-2.5 py-1 font-mono text-[11px] uppercase tracking-wide text-muted">
            <span aria-hidden="true" className="size-1.5 rounded-full bg-accent" />
            {challenges?.meta.total ?? 0} published
          </span>
        }
      />

      <Suspense fallback={<Skeleton className="mb-6 h-44 w-full" />}>
        <ChallengeFilters categories={categories} tags={allTags} />
      </Suspense>

      <ActiveFilters filters={activeFilters} clearHref={clearHref} />

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
            <ChallengeTracks challenges={visible} />

            <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
              <p className="font-mono text-xs text-faint">
                <span className="text-sm font-semibold text-foreground">
                  {tier ? visible.length : challenges.meta.total}
                </span>{" "}
                challenge{(tier ? visible.length : challenges.meta.total) === 1 ? "" : "s"}
                {tier ? " in this tier" : " in the catalog"}
              </p>
              <p className="font-mono text-[11px] uppercase tracking-wide text-faint">
                {sort ? `Sorted by ${sortLabels[sort] ?? sort}` : "Default order"}
              </p>
            </div>

            <div
              key={view}
              className={
                view === "grid"
                  ? "grid animate-fade-up gap-3 sm:grid-cols-2"
                  : "animate-fade-up border-t border-border"
              }
            >
              {visible.map((c) => (
                <ChallengeCard
                  key={c.id}
                  challenge={c}
                  variant={view === "grid" ? "tile" : "row"}
                />
              ))}
            </div>
            <PaginationNav meta={challenges.meta} hrefForPage={hrefForPage} />
          </div>
        )}
      </div>
    </div>
  );
}
