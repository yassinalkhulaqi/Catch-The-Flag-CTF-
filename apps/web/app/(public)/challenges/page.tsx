import { Suspense } from "react";
import { ChallengeCard } from "@/components/challenge-card";
import { ChallengeFilters } from "@/components/challenge-filters";
import { EmptyState, ErrorState, PageHeader } from "@/components/empty-state";
import { Skeleton } from "@/components/ui/badge";
import { serverApi } from "@/lib/api/server";
import { toQuery } from "@/lib/format";
import type { Category, ChallengeSummary, Paginated, Tag } from "@/lib/types";

export const metadata = { title: "Challenges" };

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
  const page = typeof sp.page === "string" ? sp.page : "1";

  let challenges: Paginated<ChallengeSummary> | null = null;
  let categories: Category[] = [];
  let allTags: Tag[] = [];
  let loadError = false;

  try {
    const [chRes, catRes, tagRes] = await Promise.all([
      serverApi<Paginated<ChallengeSummary>>(
        "GET",
        `/challenges${toQuery({ q, category, difficulty, tags, solved, page, per_page: 20 })}`,
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

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <PageHeader
        eyebrow="CTF"
        title="Challenges"
        description="Static, file-based challenges across SOC, DFIR, malware, RE, crypto, OSINT, and steganography."
      />

      <Suspense fallback={<Skeleton className="mb-6 h-40 w-full" />}>
        <ChallengeFilters categories={categories} tags={allTags} />
      </Suspense>

      <div className="mt-8">
        {loadError ? (
          <ErrorState description="Challenge list could not be loaded from the API." />
        ) : !challenges || challenges.data.length === 0 ? (
          <EmptyState
            title="No challenges match"
            description="Try clearing filters or check back after new challenges are published."
          />
        ) : (
          <div>
            <p className="mb-2 font-mono text-xs text-faint">
              {challenges.meta.total} challenge{challenges.meta.total === 1 ? "" : "s"}
            </p>
            <div className="border-t border-border">
              {challenges.data.map((c) => (
                <ChallengeCard key={c.id} challenge={c} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
