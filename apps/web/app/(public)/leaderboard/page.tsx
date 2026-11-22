import { Info } from "lucide-react";
import { ArenaBoard } from "@/components/leaderboard/arena-board";
import { ArenaHero } from "@/components/leaderboard/arena-hero";
import { Podium } from "@/components/leaderboard/podium";
import { YourStanding } from "@/components/leaderboard/your-standing";
import { EmptyState, ErrorState } from "@/components/empty-state";
import { getCurrentUser, serverApi } from "@/lib/api/server";
import { boardStats, findRival } from "@/lib/leaderboard/arena";
import { dictionaryFor } from "@/lib/i18n/dictionary";
import { getLocale } from "@/lib/theme/locale";
import type { LeaderboardEntry, Paginated } from "@/lib/types";

export const metadata = { title: "Leaderboard" };

export default async function LeaderboardPage() {
  const [user, locale] = await Promise.all([getCurrentUser(), getLocale()]);
  const copy = dictionaryFor(locale).arena;
  let entries: LeaderboardEntry[] = [];
  let myRank: { rank: number } | null = null;
  let loadError = false;

  try {
    const res = await serverApi<Paginated<LeaderboardEntry>>(
      "GET",
      "/leaderboard?per_page=100",
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

  const stats = boardStats(entries);
  const podium = entries.slice(0, 3);
  const rival = user ? findRival(entries, user.id) : null;
  const rank = myRank?.rank ?? rival?.entry.rank ?? null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <ArenaHero copy={copy} stats={stats} myRank={rank} />

      {loadError ? (
        <div className="mt-8">
          <ErrorState />
        </div>
      ) : entries.length === 0 ? (
        <div className="mt-8">
          <EmptyState title={copy.noRankings} description={copy.noRankingsBody} />
        </div>
      ) : (
        <>
          <Podium entries={podium} viewerId={user?.id} copy={copy} />

          <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
            <ArenaBoard entries={entries} viewerId={user?.id} copy={copy} />

            <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
              <YourStanding
                copy={copy}
                rival={rival}
                myRank={rank}
                totalPlayers={stats.players}
              />

              <div className="rounded-2xl border border-border bg-surface/40 p-5">
                <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Info aria-hidden="true" className="size-4 text-accent" />
                  {copy.howTitle}
                </h2>
                <p className="mt-2 text-xs leading-relaxed text-muted">{copy.howBody}</p>
                <p className="mt-2 text-[11px] leading-relaxed text-faint">{copy.howNote}</p>
              </div>
            </aside>
          </div>
        </>
      )}
    </div>
  );
}
