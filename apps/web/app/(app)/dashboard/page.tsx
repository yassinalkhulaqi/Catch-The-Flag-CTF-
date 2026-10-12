import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { getCurrentUser, serverApi } from "@/lib/api/server";
import { formatXp } from "@/lib/utils";
import type { ProgressOverview } from "@/lib/types";

export const metadata: Metadata = { title: "Dashboard" };

async function getOverview(): Promise<ProgressOverview | null> {
  try {
    const res = await serverApi<{ data: ProgressOverview }>(
      "GET",
      "/me/progress",
    );
    return res.data;
  } catch {
    return null;
  }
}

export default async function DashboardPage() {
  const [user, overview] = await Promise.all([
    getCurrentUser(),
    getOverview(),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
        {user ? `Welcome back, ${user.name}` : "Overview"}
      </h1>
      <p className="mt-1 text-muted">
        {user
          ? `${formatXp(user.xp)} XP · ${user.solved_count} solves`
          : "Your training at a glance."}
      </p>

      {overview ? (
        <dl className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            { term: "Paths started", value: String(overview.paths_started) },
            { term: "Paths completed", value: String(overview.paths_completed) },
            {
              term: "Lessons completed",
              value: String(overview.lessons_completed),
            },
            {
              term: "Challenges solved",
              value: String(overview.challenges_solved),
            },
          ].map((item) => (
            <Card key={item.term} className="p-4">
              <dt className="font-mono text-[11px] uppercase tracking-wide text-faint">
                {item.term}
              </dt>
              <dd className="mt-1 text-xl font-semibold text-foreground">
                {item.value}
              </dd>
            </Card>
          ))}
        </dl>
      ) : (
        <Card className="mt-6">
          <CardTitle>No progress yet</CardTitle>
          <CardDescription className="mt-2">
            Start a learning path or solve your first challenge — your stats
            will appear here.
          </CardDescription>
          <div className="mt-4 flex gap-3">
            <Link href="/paths" className="text-sm text-accent hover:underline">
              Browse paths
            </Link>
            <Link
              href="/challenges"
              className="text-sm text-accent hover:underline"
            >
              Browse challenges
            </Link>
          </div>
        </Card>
      )}
    </div>
  );
}
