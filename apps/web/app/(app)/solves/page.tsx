import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { serverApi } from "@/lib/api/server";
import type { Paginated, SolveEntry } from "@/lib/types";

export const metadata: Metadata = { title: "My solves" };

async function getSolves(): Promise<SolveEntry[]> {
  try {
    const res = await serverApi<Paginated<SolveEntry>>("GET", "/me/solves");
    return res.data;
  } catch {
    return [];
  }
}

export default async function SolvesPage() {
  const solves = await getSolves();

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
        My solves
      </h1>
      <p className="mt-1 text-muted">Every flag you caught, with points.</p>
      {solves.length === 0 ? (
        <Card className="mt-6">
          <CardTitle>No solves yet</CardTitle>
          <CardDescription className="mt-2">
            Your solved challenges will be listed here.
          </CardDescription>
          <Link
            href="/challenges"
            className="mt-4 inline-block text-sm text-accent hover:underline"
          >
            Find a challenge
          </Link>
        </Card>
      ) : (
        <ul className="mt-6 space-y-3">
          {solves.map((s) => (
            <li key={s.id}>
              <Card className="flex items-center justify-between gap-4">
                <div>
                  <CardTitle>{s.challenge.title}</CardTitle>
                  <CardDescription className="mt-1">
                    {new Date(s.solved_at).toLocaleDateString()} ·{" "}
                    {s.hints_used} hint{s.hints_used === 1 ? "" : "s"} used
                  </CardDescription>
                </div>
                <span className="shrink-0 font-mono text-sm text-accent">
                  +{s.points_awarded}
                </span>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
