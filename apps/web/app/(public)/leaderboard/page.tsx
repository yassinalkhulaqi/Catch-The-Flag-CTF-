import type { Metadata } from "next";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { serverApi } from "@/lib/api/server";
import type { LeaderboardEntry } from "@/lib/types";

export const metadata: Metadata = { title: "Leaderboard" };

async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  try {
    const res = await serverApi<{ data: LeaderboardEntry[] }>(
      "GET",
      "/leaderboard",
    );
    return res.data;
  } catch {
    return [];
  }
}

export default async function LeaderboardPage() {
  const entries = await getLeaderboard();

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <p className="font-mono text-xs uppercase tracking-widest text-accent">
        Leaderboard
      </p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
        Ranked by XP, then solves
      </h1>
      <p className="mt-3 text-muted">
        Deterministic order: XP descending, solved count descending, account
        age ascending. Computed server-side.
      </p>

      {entries.length === 0 ? (
        <Card className="mt-8">
          <CardTitle>No rankings yet</CardTitle>
          <CardDescription className="mt-2">
            Solve a challenge to take the top spot.
          </CardDescription>
        </Card>
      ) : (
        <ol className="mt-8 space-y-2">
          {entries.map((e) => (
            <li key={e.id}>
              <Card className="flex items-center gap-4">
                <span
                  className="w-8 shrink-0 font-mono text-sm text-faint"
                  aria-hidden="true"
                >
                  {String(e.rank).padStart(2, "0")}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {e.name}
                  </p>
                  <p className="font-mono text-xs text-faint">
                    {e.xp} XP · {e.solved_count} solves
                  </p>
                </div>
              </Card>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
