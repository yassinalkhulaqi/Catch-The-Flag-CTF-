import { Crown, Medal, Sparkles, Trophy, Users } from "lucide-react";
import { EmptyState, ErrorState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { getCurrentUser, serverApi } from "@/lib/api/server";
import { dictionaryFor } from "@/lib/i18n/dictionary";
import { getLocale } from "@/lib/theme/locale";
import { cn, formatXp } from "@/lib/utils";
import type { LeaderboardEntry, Paginated } from "@/lib/types";

export const metadata = { title: "Leaderboard" };

const PODIUM_TONE = [
  "border-warning/40 bg-warning/5",
  "border-accent/40 bg-accent/5",
  "border-info/30 bg-info/5",
] as const;

const PODIUM_ICON = [Crown, Trophy, Medal] as const;

export default async function LeaderboardPage() {
  const user = await getCurrentUser();
  const copy = dictionaryFor(await getLocale());
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

  const topXp = entries[0]?.xp ?? 0;
  const podium = entries.slice(0, 3);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <section className="relative overflow-hidden rounded-2xl border border-border bg-surface/60 p-6 sm:p-8">
        <div aria-hidden="true" className="aurora pointer-events-none absolute inset-0 opacity-60" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="type-eyebrow text-accent">Progression</p>
            <h1 className="type-title mt-2 text-balance">{copy.pages.leaderboardTitle}</h1>
            <p className="mt-3 text-sm leading-relaxed text-muted sm:text-base">
              {copy.pages.leaderboardBody}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Badge tone="neutral">
                <Users aria-hidden="true" className="size-3" />
                {entries.length} ranked
              </Badge>
              {topXp > 0 ? (
                <Badge tone="accent">
                  <Sparkles aria-hidden="true" className="size-3" />
                  Top {formatXp(topXp)} XP
                </Badge>
              ) : null}
            </div>
          </div>
          {myRank ? (
            <div className="rounded-xl border border-accent/30 bg-accent/10 px-4 py-3">
              <p className="font-mono text-[10px] uppercase tracking-wide text-accent">Your rank</p>
              <p className="mt-0.5 font-display text-2xl font-semibold tabular-nums">
                #{myRank.rank}
              </p>
            </div>
          ) : null}
        </div>
      </section>

      {loadError ? (
        <div className="mt-8">
          <ErrorState />
        </div>
      ) : entries.length === 0 ? (
        <div className="mt-8">
          <EmptyState title="No rankings yet" description="Solve a challenge to appear here." />
        </div>
      ) : (
        <>
          <ol className="mt-8 grid gap-3 md:grid-cols-3" aria-label="Top players">
            {podium.map((row, index) => {
              const Icon = PODIUM_ICON[index];
              const isFirst = index === 0;
              return (
                <li
                  key={row.id}
                  className={cn(
                    "relative overflow-hidden rounded-xl border p-5",
                    PODIUM_TONE[index],
                    isFirst && "md:order-2 md:-translate-y-1",
                    index === 1 && "md:order-1",
                    index === 2 && "md:order-3",
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="inline-flex size-9 items-center justify-center rounded-lg border border-white/10 bg-background/40">
                      <Icon aria-hidden="true" className="size-4 text-accent" />
                    </span>
                    <span className="font-mono text-xs text-muted">#{row.rank}</span>
                  </div>
                  <p className="mt-4 truncate text-lg font-semibold">
                    {row.name}
                    {user?.id === row.id ? (
                      <span className="ms-2 font-mono text-[11px] text-accent">you</span>
                    ) : null}
                  </p>
                  <p className="mt-1 font-mono text-sm text-muted">
                    {formatXp(row.xp)} XP · {row.solved_count} solves
                  </p>
                </li>
              );
            })}
          </ol>

          <div className="mt-6 overflow-hidden rounded-2xl border border-border">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-sm">
                <caption className="sr-only">Leaderboard ranked by XP, then solves</caption>
                <thead className="border-b border-border bg-surface">
                  <tr className="font-mono text-[11px] uppercase tracking-wide text-muted">
                    <th scope="col" className="px-4 py-3">Rank</th>
                    <th scope="col" className="px-4 py-3">Player</th>
                    <th scope="col" className="px-4 py-3">XP</th>
                    <th scope="col" className="px-4 py-3">Solves</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((row) => {
                    const isMe = user?.id === row.id;
                    return (
                      <tr
                        key={row.id}
                        className={cn(
                          "border-b border-border/70 transition-colors last:border-0 hover:bg-surface/60",
                          isMe && "bg-accent/5",
                        )}
                      >
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              "inline-flex min-w-8 justify-center rounded-md px-1.5 py-0.5 font-mono text-xs",
                              row.rank <= 3
                                ? "bg-accent/10 text-accent"
                                : "text-muted",
                            )}
                          >
                            #{row.rank}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <span
                              aria-hidden="true"
                              className="inline-flex size-7 items-center justify-center rounded-full border border-border bg-surface-raised font-mono text-[10px] uppercase text-muted"
                            >
                              {row.name.slice(0, 2)}
                            </span>
                            <span className="font-medium text-foreground">
                              {row.name}
                              {isMe ? (
                                <span className="ms-2 font-mono text-[11px] text-accent">you</span>
                              ) : null}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono">{formatXp(row.xp)}</td>
                        <td className="px-4 py-3 font-mono">{row.solved_count}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {myRank ? (
            <div className="sticky bottom-4 z-30 mt-4 flex items-center justify-between gap-3 rounded-xl border border-accent/40 bg-surface/95 px-4 py-3 text-sm shadow-[var(--shadow-float)] backdrop-blur">
              <span className="text-muted">Your position on this board</span>
              <span className="font-mono text-accent">#{myRank.rank}</span>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
