import { DifficultyBadge } from "@/components/difficulty-badge";
import { Badge } from "@/components/ui/badge";
import { formatXp } from "@/lib/utils";
import type { Difficulty } from "@/lib/types";

/**
 * PortSwigger-style objective callout for a static artifact lab.
 * Server Component — presentational only, no client JS.
 */
export function LabObjective({
  objective,
  target,
  difficulty,
  points,
  categoryName,
}: {
  /** Objective statement (challenge scenario). Null when the author left it blank. */
  objective: string | null;
  /** Target summary for a file-based lab (artifact bundle, not a live host). */
  target: string;
  difficulty: Difficulty;
  points: number;
  categoryName?: string;
}) {
  return (
    <section
      aria-labelledby="lab-objective-heading"
      data-testid="lab-objective"
      className="rounded-xl border border-accent/30 bg-surface p-5 shadow-sm"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="lab-objective-heading" className="type-eyebrow text-accent">
          Lab objective
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <DifficultyBadge difficulty={difficulty} />
          <Badge tone="accent" data-testid="lab-objective-points">
            {formatXp(points)} pts
          </Badge>
        </div>
      </div>

      <dl className="mt-4 space-y-3 text-sm">
        <div>
          <dt className="font-mono text-[11px] uppercase tracking-[0.14em] text-faint">
            Target
          </dt>
          <dd className="mt-1 font-mono text-[13px] text-foreground" data-testid="lab-objective-target">
            {target}
          </dd>
        </div>
        <div>
          <dt className="font-mono text-[11px] uppercase tracking-[0.14em] text-faint">
            Objective
          </dt>
          <dd className="mt-1 text-sm leading-relaxed text-muted" data-testid="lab-objective-text">
            {objective ?? "Analyze the artifacts below and recover the flag."}
          </dd>
        </div>
      </dl>

      {categoryName ? (
        <p className="mt-4 font-mono text-[11px] uppercase tracking-wide text-faint">
          {categoryName} · {difficulty} tier
        </p>
      ) : (
        <p className="mt-4 font-mono text-[11px] uppercase tracking-wide text-faint">
          {difficulty} tier
        </p>
      )}
    </section>
  );
}
