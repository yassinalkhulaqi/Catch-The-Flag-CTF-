import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { SearchFilterBar } from "@/components/search-filter-bar";
import { DifficultyPill } from "@/components/difficulty-pill";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { serverApi } from "@/lib/api/server";
import { listPaths } from "@/lib/api/paths";
import type { Category } from "@/lib/types";

export const metadata: Metadata = { title: "Learning paths" };

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

export default async function PathsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    category?: string;
    difficulty?: string;
  }>;
}) {
  const params = await searchParams;
  const [paths, categories] = await Promise.all([
    listPaths({
      q: params.q,
      category: params.category,
      difficulty: params.difficulty,
    }),
    getCategories(),
  ]);
  const filtered =
    params.q !== undefined ||
    params.category !== undefined ||
    params.difficulty !== undefined;

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <p className="font-mono text-xs uppercase tracking-widest text-accent">
        Learning paths
      </p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
        Theory first, flags second
      </h1>
      <p className="mt-3 max-w-2xl text-muted">
        Structured curricula — modules, lessons and quizzes in order — each
        paired with hands-on challenges.
      </p>

      <div className="mt-8">
        <Suspense>
          <SearchFilterBar categories={categories} showSolved={false} />
        </Suspense>
      </div>

      {paths.length === 0 ? (
        <Card className="mt-8">
          <CardTitle>
            {filtered ? "No paths match your filters" : "No paths published yet"}
          </CardTitle>
          <CardDescription className="mt-2">
            {filtered
              ? "Try widening the search or clearing the active filters."
              : "The first demo path is being authored. Check back soon."}
          </CardDescription>
          {filtered ? (
            <Link href="/paths" className={buttonVariants("outline", "sm")}>
              Clear filters
            </Link>
          ) : null}
        </Card>
      ) : (
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {paths.map((p) => (
            <li key={p.id}>
              <Card className="flex h-full flex-col">
                <div className="flex flex-wrap items-center gap-2">
                  {p.category ? (
                    <Badge tone="neutral">{p.category.name}</Badge>
                  ) : null}
                  <DifficultyPill difficulty={p.difficulty} />
                  {p.progress_percent > 0 ? (
                    <Badge tone="info">{p.progress_percent}%</Badge>
                  ) : null}
                </div>
                <CardTitle className="mt-3 text-base">
                  <Link href={`/paths/${p.slug}`} className="hover:text-accent">
                    {p.title}
                  </Link>
                </CardTitle>
                <CardDescription className="mt-2">{p.summary}</CardDescription>
                <p className="mt-3 font-mono text-xs text-faint">
                  {p.module_count} modules · {p.lesson_count} lessons ·{" "}
                  {p.challenge_count} challenges
                </p>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
