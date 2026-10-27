import { Medal, Sparkles } from "lucide-react";
import { SectionHeading } from "@/components/landing/section-heading";
import { Badge } from "@/components/ui/badge";
import { formatXp } from "@/lib/utils";
import type { LeaderboardEntry } from "@/lib/types";

export function LeaderboardPreview({ entries }: { entries: LeaderboardEntry[] }) {
  if (entries.length === 0) return null;
  const podium = [entries[1], entries[0], entries[2]].filter(
    (entry): entry is LeaderboardEntry => Boolean(entry),
  );
  const medalTone = ["text-muted", "text-accent", "text-warning"];

  return (
    <section className="relative border-t border-border" aria-labelledby="board-preview">
      <div className="mx-auto max-w-6xl px-4 py-16 lg:py-20">
        <SectionHeading
          id="board-preview"
          eyebrow="// Standings"
          title="The board rewards finished work"
          description="Ordered by XP, then solves, then account id. No streak multipliers, no hidden bonuses."
          href="/leaderboard"
          linkLabel="Full board"
        />
        <ol className="grid gap-3 md:grid-cols-[1fr_1.12fr_1fr] md:items-end">
          {podium.map((entry, index) => {
            const isFirst = entry.rank === 1;
            return (
              <li key={entry.id} className={isFirst ? "md:-translate-y-4" : ""}>
                <div
                  className={`relative overflow-hidden rounded-2xl border p-5 ${
                    isFirst
                      ? "border-accent/40 bg-accent/5 shadow-[var(--glow-accent)]"
                      : "border-border bg-surface"
                  }`}
                >
                  {isFirst ? (
                    <span
                      aria-hidden="true"
                      className="absolute inset-x-0 top-0 h-0.5 bg-[image:var(--accent-gradient)]"
                    />
                  ) : null}
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-mono text-xs text-accent">#{entry.rank}</span>
                    <Medal
                      aria-hidden="true"
                      className={`size-4 ${medalTone[index] ?? "text-faint"}`}
                    />
                  </div>
                  <p className="mt-4 truncate text-lg font-semibold">{entry.name}</p>
                  <p className="mt-1 font-mono text-sm text-muted">
                    {formatXp(entry.xp)} XP · {entry.solved_count} solves
                  </p>
                  {isFirst ? (
                    <Badge tone="accent" className="mt-4">
                      <Sparkles aria-hidden="true" className="size-3" />
                      Current leader
                    </Badge>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
