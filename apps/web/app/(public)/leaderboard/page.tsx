import { EmptyState, ErrorState, PageHeader } from "@/components/empty-state";
import { getCurrentUser, serverApi } from "@/lib/api/server";
import { formatXp } from "@/lib/utils";
import type { LeaderboardEntry, Paginated } from "@/lib/types";

export const metadata = { title: "Leaderboard" };

export default async function LeaderboardPage() {
  const user = await getCurrentUser();
  let entries: LeaderboardEntry[] = [];
  let myRank: { rank: number } | null = null;
  let loadError = false;

  try {
    const res = await serverApi<Paginated<LeaderboardEntry>>(
      "GET",
      "/leaderboard?per_page=50",
    );
    entries = res.data;
    if (user) {
      try {
        const me = await serverApi<{ data: { rank: number } }>("GET", "/leaderboard/me");
        myRank = me.data;
      } catch {
        myRank = null;
      }
    }
  } catch {
    loadError = true;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <PageHeader
        eyebrow="Progression"
        title="Leaderboard"
        description="Ranked by XP, then solves, then account id — deterministic and server-side."
        actions={
          myRank ? (
            <p className="font-mono text-sm text-accent">Your rank: #{myRank.rank}</p>
          ) : null
        }
      />

      {loadError ? (
        <ErrorState />
      ) : entries.length === 0 ? (
        <EmptyState title="No rankings yet" description="Solve a challenge to appear here." />
      ) : (
        <>
        <ol className="mb-8 grid gap-3 md:grid-cols-3">
          {entries.slice(0, 3).map((row) => (
            <li
              key={row.id}
              className="rounded-xl border border-border bg-surface p-4"
            >
              <p className="font-mono text-xs text-accent">#{row.rank}</p>
              <p className="mt-2 text-lg font-semibold">
                {row.name}
                {user?.id === row.id ? <span className="ms-2 font-mono text-[11px] text-accent">you</span> : null}
              </p>
              <p className="font-mono text-sm text-muted">{formatXp(row.xp)} XP · {row.solved_count} solves</p>
            </li>
          ))}
        </ol>
        <div className="overflow-x-auto border border-border">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="border-b border-border bg-surface">
              <tr className="font-mono text-[11px] uppercase tracking-wide text-muted">
                <th className="px-4 py-3">Rank</th>
                <th className="px-4 py-3">Player</th>
                <th className="px-4 py-3">XP</th>
                <th className="px-4 py-3">Solves</th>
                <th className="px-4 py-3">Achievements</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((row) => {
                const isMe = user?.id === row.id;
                return (
                  <tr
                    key={row.id}
                    className={
                      isMe
                        ? "border-b border-border bg-accent/5"
                        : "border-b border-border/70"
                    }
                  >
                    <td className="px-4 py-3 font-mono text-accent">#{row.rank}</td>
                    <td className="px-4 py-3 font-medium text-foreground">
                      {row.name}
                      {isMe ? (
                        <span className="ms-2 font-mono text-[11px] text-accent">you</span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 font-mono">{formatXp(row.xp)}</td>
                    <td className="px-4 py-3 font-mono">{row.solved_count}</td>
                    <td className="px-4 py-3 font-mono">{row.achievements_count}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {myRank ? (
          <div className="sticky bottom-4 z-30 mt-4 rounded-lg border border-accent/40 bg-surface/95 px-4 py-3 text-sm shadow-md backdrop-blur">
            Your rank <span className="font-mono text-accent">#{myRank.rank}</span>
          </div>
        ) : null}
        </>
      )}
    </div>
  );
}
