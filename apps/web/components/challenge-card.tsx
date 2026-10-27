import Link from "next/link";
import { DifficultyBadge } from "@/components/difficulty-badge";
import { TierPill } from "@/components/tier-pill";
import { Badge } from "@/components/ui/badge";
import { tierFor } from "@/lib/tracks";
import { cn, formatXp } from "@/lib/utils";
import type { ChallengeSummary } from "@/lib/types";

export function ChallengeCard({
  challenge,
  className,
  variant = "row",
}: {
  challenge: ChallengeSummary;
  className?: string;
  variant?: "row" | "tile";
}) {
  const isTile = variant === "tile";

  return (
    <Link
      href={`/challenges/${challenge.slug}`}
      className={cn(
        "group relative block transition-colors",
        isTile
          ? "card-lift h-full overflow-hidden rounded-2xl border border-border bg-surface p-5 hover:border-border-strong"
          : "border-b border-border py-4 hover:bg-surface/60",
        className,
      )}
    >
      {isTile ? (
        <span
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-0.5 opacity-70 transition-opacity group-hover:opacity-100"
          style={{ background: challenge.category.color ?? "var(--accent)" }}
        />
      ) : null}
      <div className={cn("flex h-full gap-3", isTile ? "flex-col" : "flex-wrap items-start justify-between")}>
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="inline-block size-2 rounded-full"
              style={{ background: challenge.category.color ?? "var(--accent)" }}
              aria-hidden="true"
            />
            <span className="font-mono text-[11px] uppercase tracking-wide text-muted">
              {challenge.category.name}
            </span>
            <DifficultyBadge difficulty={challenge.difficulty} />
            <TierPill tier={tierFor(challenge.difficulty)} />
            {challenge.solved ? (
              <Badge tone="success" data-testid="solved-badge">
                Solved
              </Badge>
            ) : null}
          </div>
          <h3 className="text-base font-semibold text-foreground group-hover:text-accent">
            {challenge.title}
          </h3>
          {challenge.tags.length > 0 ? (
            <ul aria-label="Vulnerability tags" className="flex flex-wrap gap-1">
              {challenge.tags.map((t) => (
                <li key={t.id}>
                  <Badge tone="neutral">{t.name}</Badge>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        <div
          className={cn(
            "shrink-0",
            isTile
              ? "mt-auto flex w-full items-center justify-between border-t border-border pt-3 text-left"
              : "text-right",
          )}
        >
          <p className="font-mono text-sm text-accent">{formatXp(challenge.points)} pts</p>
          <p className="text-xs text-faint" data-testid="solve-count">
            {challenge.solve_count} solve{challenge.solve_count === 1 ? "" : "s"}
          </p>
        </div>
      </div>
    </Link>
  );
}
