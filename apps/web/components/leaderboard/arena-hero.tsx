import { Sparkles, Target, Trophy, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { ArenaStats } from "@/lib/leaderboard/arena";
import type { Dictionary } from "@/lib/i18n/en";
import { formatXp } from "@/lib/utils";

export function ArenaHero({
  copy,
  stats,
  myRank,
}: {
  copy: Dictionary["arena"];
  stats: ArenaStats;
  myRank: number | null;
}) {
  const tiles = [
    {
      label: copy.ranked,
      value: formatXp(stats.players),
      icon: Users,
    },
    {
      label: copy.totalXp,
      value: formatXp(stats.totalXp),
      icon: Trophy,
    },
    {
      label: copy.totalSolves,
      value: formatXp(stats.totalSolves),
      icon: Target,
    },
    {
      label: copy.averageXp,
      value: formatXp(stats.averageXp),
      icon: Sparkles,
    },
  ] as const;

  return (
    <section
      aria-labelledby="arena-title"
      className="relative overflow-hidden rounded-2xl border border-border bg-surface/60"
    >
      <div
        aria-hidden="true"
        className="aurora pointer-events-none absolute inset-0 opacity-70"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,color-mix(in_oklab,var(--border)_35%,transparent)_1px,transparent_1px)] bg-[size:48px_100%] opacity-30"
      />
      <div className="relative grid gap-8 p-6 sm:p-8 lg:grid-cols-[1.35fr_1fr] lg:items-end">
        <div className="max-w-2xl">
          <p className="type-eyebrow flex items-center gap-2 text-accent">
            <span aria-hidden="true" className="relative flex size-1.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-accent opacity-60 motion-reduce:animate-none" />
              <span className="relative inline-flex size-1.5 rounded-full bg-accent" />
            </span>
            {copy.eyebrow}
          </p>
          <h1 id="arena-title" className="type-title mt-3 text-balance">
            {copy.title}
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted sm:text-base">
            {copy.body}
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <Badge tone="neutral">
              <Users aria-hidden="true" className="size-3" />
              {formatXp(stats.players)} {copy.ranked}
            </Badge>
            {stats.leaderXp > 0 ? (
              <Badge tone="accent">
                <Trophy aria-hidden="true" className="size-3" />
                {formatXp(stats.leaderXp)} XP
              </Badge>
            ) : null}
            {myRank ? (
              <Badge tone="success" data-testid="arena-my-rank">
                #{myRank}
              </Badge>
            ) : null}
          </div>
        </div>

        <dl className="grid grid-cols-2 gap-2.5">
          {tiles.map(({ label, value, icon: Icon }) => (
            <div
              key={label}
              className="rounded-xl border border-border/80 bg-background/40 p-3 backdrop-blur-sm"
            >
              <dt className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wide text-faint">
                <Icon aria-hidden="true" className="size-3 text-accent/80" />
                <span className="truncate">{label}</span>
              </dt>
              <dd className="mt-1.5 font-display text-xl font-semibold tabular-nums text-foreground">
                {value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
