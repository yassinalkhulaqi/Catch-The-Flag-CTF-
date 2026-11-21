import { Crown, Medal, Trophy } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { xpPerSolve } from "@/lib/leaderboard/arena";
import type { Dictionary } from "@/lib/i18n/en";
import { cn, formatXp } from "@/lib/utils";
import type { LeaderboardEntry } from "@/lib/types";

const PODIUM_TONE = [
  "border-warning/40 bg-warning/[0.06]",
  "border-accent/40 bg-accent/[0.06]",
  "border-info/30 bg-info/[0.05]",
] as const;

const PODIUM_ICON = [Crown, Trophy, Medal] as const;

export function Podium({
  entries,
  viewerId,
  copy,
}: {
  entries: LeaderboardEntry[];
  viewerId?: number;
  copy: Dictionary["arena"];
}) {
  if (entries.length === 0) return null;

  return (
    <section aria-labelledby="arena-podium-title" className="mt-8">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h2 id="arena-podium-title" className="text-lg font-semibold text-foreground">
          {copy.topPlayers}
        </h2>
        <p className="font-mono text-[11px] uppercase tracking-wide text-faint">
          {copy.rank} #1–{entries.length}
        </p>
      </div>
      <ol className="mt-3 grid gap-3 md:grid-cols-3 md:items-end">
        {entries.map((row, index) => {
          const Icon = PODIUM_ICON[index] ?? Medal;
          const isFirst = index === 0;
          const isMe = viewerId === row.id;
          return (
            <li
              key={row.id}
              className={cn(
                "relative overflow-hidden rounded-2xl border p-5",
                PODIUM_TONE[index] ?? PODIUM_TONE[2],
                isFirst && "md:order-2 md:pb-7",
                index === 1 && "md:order-1",
                index === 2 && "md:order-3",
                isMe && "ring-1 ring-accent/50",
              )}
            >
              <span
                aria-hidden="true"
                className="absolute inset-x-0 top-0 h-0.5 bg-[image:var(--accent-gradient)] opacity-70"
              />
              <div className="flex items-start justify-between gap-2">
                <span className="inline-flex size-9 items-center justify-center rounded-lg border border-white/10 bg-background/40">
                  <Icon aria-hidden="true" className="size-4 text-accent" />
                </span>
                <span className="font-mono text-xs text-muted">#{row.rank}</span>
              </div>

              <div className="mt-4 flex items-center gap-3">
                <Avatar
                  name={row.name}
                  className={cn(isFirst ? "size-12 text-sm" : "size-10")}
                />
                <div className="min-w-0">
                  <p className="truncate text-base font-semibold text-foreground">
                    {row.name}
                  </p>
                  <p className="font-mono text-xs text-muted">
                    {formatXp(row.xp)} XP
                  </p>
                </div>
                {isMe ? (
                  <Badge tone="accent" className="ms-auto shrink-0">
                    {copy.you}
                  </Badge>
                ) : null}
              </div>

              <dl className="mt-4 grid grid-cols-2 gap-2 border-t border-white/5 pt-3 text-xs">
                <div>
                  <dt className="font-mono text-[10px] uppercase tracking-wide text-faint">
                    {copy.solves}
                  </dt>
                  <dd className="mt-0.5 font-mono tabular-nums text-foreground">
                    {formatXp(row.solved_count)}
                  </dd>
                </div>
                <div>
                  <dt className="font-mono text-[10px] uppercase tracking-wide text-faint">
                    {copy.badges}
                  </dt>
                  <dd className="mt-0.5 font-mono tabular-nums text-foreground">
                    {formatXp(row.achievements_count)}
                  </dd>
                </div>
              </dl>
              <p className="mt-2 font-mono text-[10px] uppercase tracking-wide text-faint">
                {formatXp(xpPerSolve(row))} {copy.efficiency}
              </p>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
