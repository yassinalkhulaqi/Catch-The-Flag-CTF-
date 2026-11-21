import Link from "next/link";
import { ArrowUpRight, Crown, Flag, Target, Trophy } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  boardPercentile,
  type ArenaRival,
} from "@/lib/leaderboard/arena";
import type { Dictionary } from "@/lib/i18n/en";
import { formatXp } from "@/lib/utils";

export function YourStanding({
  copy,
  rival,
  myRank,
  totalPlayers,
}: {
  copy: Dictionary["arena"];
  rival: ArenaRival | null;
  myRank: number | null;
  totalPlayers: number;
}) {
  if (!rival || !myRank) {
    const rankedElsewhere = myRank !== null && myRank !== undefined;
    return (
      <section
        aria-labelledby="standing-title"
        className="rounded-2xl border border-border bg-surface/50 p-5"
      >
        <p className="type-eyebrow text-faint">{copy.yourStanding}</p>
        <h2 id="standing-title" className="mt-2 text-lg font-semibold">
          {rankedElsewhere ? `#${myRank}` : copy.unranked}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          {rankedElsewhere ? copy.outsideBoard : copy.unrankedBody}
        </p>
        <Link
          href="/challenges"
          className={buttonVariants("outline", "sm", "mt-4 w-full")}
        >
          {copy.unrankedCta}
          <ArrowUpRight aria-hidden="true" className="size-3.5" />
        </Link>
      </section>
    );
  }

  const { entry, above, below, gapToAbove, gapToBelow } = rival;
  const percentile = boardPercentile(myRank, totalPlayers);
  const progressToAbove = above ? Math.min(100, (entry.xp / Math.max(1, above.xp)) * 100) : 100;

  return (
    <section
      aria-labelledby="standing-title"
      className="relative overflow-hidden rounded-2xl border border-accent/30 bg-surface/60 p-5"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -end-10 -top-10 size-32 rounded-full bg-accent/10 blur-2xl"
      />
      <div className="relative">
        <div className="flex items-center justify-between gap-2">
          <p id="standing-title" className="type-eyebrow text-accent">
            {copy.yourStanding}
          </p>
          <Badge tone="accent">
            {copy.rank} #{myRank}
          </Badge>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <Avatar name={entry.name} className="size-11 text-sm" />
          <div className="min-w-0">
            <p className="truncate font-semibold text-foreground">{entry.name}</p>
            <p className="font-mono text-[11px] uppercase tracking-wide text-faint">
              Top {percentile}% {copy.ofPlayers} {formatXp(totalPlayers)}
            </p>
          </div>
        </div>

        <dl className="mt-4 grid grid-cols-3 gap-2 rounded-xl border border-border/70 bg-background/40 p-3">
          <div>
            <dt className="font-mono text-[10px] uppercase tracking-wide text-faint">
              {copy.xp}
            </dt>
            <dd className="mt-0.5 font-mono text-sm tabular-nums text-foreground">
              {formatXp(entry.xp)}
            </dd>
          </div>
          <div>
            <dt className="font-mono text-[10px] uppercase tracking-wide text-faint">
              {copy.solves}
            </dt>
            <dd className="mt-0.5 font-mono text-sm tabular-nums text-foreground">
              {formatXp(entry.solved_count)}
            </dd>
          </div>
          <div>
            <dt className="font-mono text-[10px] uppercase tracking-wide text-faint">
              {copy.badges}
            </dt>
            <dd className="mt-0.5 font-mono text-sm tabular-nums text-foreground">
              {formatXp(entry.achievements_count)}
            </dd>
          </div>
        </dl>

        {above ? (
          <div className="mt-4 rounded-xl border border-border/70 bg-background/40 p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wide text-faint">
                <Flag aria-hidden="true" className="size-3" />
                {copy.nextRival}
              </p>
              <p className="truncate text-xs font-medium text-foreground">{above.name}</p>
            </div>
            <Progress
              value={progressToAbove}
              max={100}
              size="sm"
              label={`${copy.gapToAbove}: ${above.name}`}
              className="mt-3"
            />
            <p className="mt-2 flex items-center justify-between gap-2 text-xs">
              <span className="text-muted">
                <span className="font-mono text-accent">{formatXp(gapToAbove)}</span>{" "}
                {copy.gapToAbove}
              </span>
              <span className="font-mono text-[10px] text-faint">#{above.rank}</span>
            </p>
          </div>
        ) : (
          <div className="mt-4 rounded-xl border border-success/30 bg-success/[0.06] p-3">
            <p className="flex items-center gap-1.5 text-sm font-semibold text-success">
              <Crown aria-hidden="true" className="size-4" />
              {copy.lead}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-muted">{copy.leadBody}</p>
            {below ? (
              <p className="mt-2 flex items-center justify-between gap-2 border-t border-success/20 pt-2 text-xs">
                <span className="text-muted">{copy.cushion}</span>
                <span className="font-mono text-success">{formatXp(gapToBelow)} XP</span>
              </p>
            ) : null}
          </div>
        )}

        <div className="mt-3 flex items-center justify-between gap-2 text-[11px] text-faint">
          <span className="flex items-center gap-1.5">
            <Trophy aria-hidden="true" className="size-3" />
            {copy.position}
          </span>
          <span className="flex items-center gap-1.5 font-mono">
            <Target aria-hidden="true" className="size-3" />
            {formatXp(entry.xp)} XP
          </span>
        </div>
      </div>
    </section>
  );
}
