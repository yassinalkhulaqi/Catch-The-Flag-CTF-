import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { serverApi } from "@/lib/api/server";
import type { ChallengeSummary, Paginated } from "@/lib/types";

export const metadata: Metadata = { title: "Challenges" };

async function getChallenges(): Promise<ChallengeSummary[]> {
  try {
    const res = await serverApi<Paginated<ChallengeSummary>>(
      "GET",
      "/challenges",
    );
    return res.data;
  } catch {
    return [];
  }
}

export default async function ChallengesPage() {
  const challenges = await getChallenges();

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

      {challenges.length === 0 ? (
        <Card className="mt-8">
          <CardTitle>No challenges published yet</CardTitle>
          <CardDescription className="mt-2">
            The first challenge set is being authored. Pick a learning path in
            the meantime.
          </CardDescription>
          <Link href="/paths" className={buttonVariants("outline", "sm")}>
            Browse paths
          </Link>
        </Card>
      ) : (
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {challenges.map((c) => (
            <li key={c.id}>
              <Card className="h-full">
                <CardTitle>
                  <Link
                    href={`/challenges/${c.slug}`}
                    className="hover:text-accent"
                  >
                    {c.title}
                  </Link>
                </CardTitle>
                <CardDescription className="mt-2">
                  {c.category.name} · {c.difficulty} · {c.points} pts ·{" "}
                  {c.solve_count} solves
                </CardDescription>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
