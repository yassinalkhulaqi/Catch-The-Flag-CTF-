import Link from "next/link";
import { DifficultyBadge } from "@/components/difficulty-badge";
import { Badge } from "@/components/ui/badge";
import { cn, formatXp } from "@/lib/utils";
import type { ChallengeSummary } from "@/lib/types";

export function ChallengeCard({
  challenge,
  className,
}: {
  challenge: ChallengeSummary;
  className?: string;
}) {
  return (
    <Link
      href={`/challenges/${challenge.slug}`}
      className={cn(
        "group block border-b border-border py-4 transition-colors hover:bg-surface/60",
        className,
      )}
      style={{ viewTransitionName: `c-${challenge.slug}` }}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1.5">
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
            <p className="font-mono text-xs text-faint">
              {challenge.tags.map((t) => t.name).join(" · ")}
            </p>
          ) : null}
        </div>
        <div className="shrink-0 text-end">
          <p className="font-mono text-sm text-accent">{formatXp(challenge.points)} pts</p>
          <p className="text-xs text-faint">{challenge.solve_count} solves</p>
        </div>
      </div>
    </Link>
  );
}
