import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { serverApi } from "@/lib/api/server";
import type { Paginated, PathSummary } from "@/lib/types";

export const metadata: Metadata = { title: "Learning paths" };

async function getPaths(): Promise<PathSummary[]> {
  try {
    const res = await serverApi<Paginated<PathSummary>>("GET", "/paths");
    return res.data;
  } catch {
    return [];
  }
}

export default async function PathsPage() {
  const paths = await getPaths();

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

      {paths.length === 0 ? (
        <Card className="mt-8">
          <CardTitle>No paths published yet</CardTitle>
          <CardDescription className="mt-2">
            The first demo path is being authored. Check back soon.
          </CardDescription>
        </Card>
      ) : (
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {paths.map((p) => (
            <li key={p.id}>
              <Card className="h-full">
                <CardTitle>
                  <Link href={`/paths/${p.slug}`} className="hover:text-accent">
                    {p.title}
                  </Link>
                </CardTitle>
                <CardDescription className="mt-2">
                  {p.summary}
                </CardDescription>
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
