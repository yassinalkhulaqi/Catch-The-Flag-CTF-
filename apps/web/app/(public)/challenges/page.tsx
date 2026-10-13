import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ChallengeCard } from "@/components/challenge-card";
import { SearchFilterBar } from "@/components/search-filter-bar";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { listChallenges } from "@/lib/api/challenges";
import { serverApi } from "@/lib/api/server";
import type { Category } from "@/lib/types";

export const metadata: Metadata = { title: "Challenges" };

async function getCategories(): Promise<
  Array<Pick<Category, "id" | "name" | "slug">>
> {
  try {
    const res = await serverApi<{ data: Category[] }>("GET", "/categories");
    return res.data;
  } catch {
    return [];
  }
}

function hasActiveFilters(params: Record<string, string | undefined>): boolean {
  return ["q", "category", "difficulty", "solved"].some(
    (key) => params[key] !== undefined && params[key] !== "",
  );
}

export default async function ChallengesPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    category?: string;
    difficulty?: string;
    solved?: string;
  }>;
}) {
  const params = await searchParams;
  const [challenges, categories] = await Promise.all([
    listChallenges({
      q: params.q,
      category: params.category,
      difficulty: params.difficulty,
      solved: params.solved,
    }),
    getCategories(),
  ]);
  const filtered = hasActiveFilters(params);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <p className="font-mono text-xs uppercase tracking-widest text-accent">
        Challenges
      </p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
        File-based CTF challenges
      </h1>
      <p className="mt-3 max-w-2xl text-muted">
        Download the files, analyse them offline, submit the flag. No live
        infrastructure in V1 — the artifact is the arena.
      </p>

      <div className="mt-8">
        <Suspense>
          <SearchFilterBar categories={categories} />
        </Suspense>
      </div>

      {challenges.length === 0 ? (
        <Card className="mt-8">
          <CardTitle>
            {filtered
              ? "No challenges match your filters"
              : "No challenges published yet"}
          </CardTitle>
          <CardDescription className="mt-2">
            {filtered
              ? "Try widening the search or clearing the active filters."
              : "The first challenge set is being authored. Pick a learning path in the meantime."}
          </CardDescription>
          {filtered ? (
            <Link href="/challenges" className={buttonVariants("outline", "sm")}>
              Clear filters
            </Link>
          ) : (
            <Link href="/paths" className={buttonVariants("outline", "sm")}>
              Browse paths
            </Link>
          )}
        </Card>
      ) : (
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {challenges.map((c) => (
            <li key={c.id}>
              <ChallengeCard challenge={c} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
