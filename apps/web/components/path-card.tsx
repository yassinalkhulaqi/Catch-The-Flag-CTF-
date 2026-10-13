import Link from "next/link";
import { DifficultyBadge } from "@/components/difficulty-badge";
import { cn } from "@/lib/utils";
import type { PathSummary } from "@/lib/types";

export function PathCard({
  path,
  className,
}: {
  path: PathSummary;
  className?: string;
}) {
  return (
    <Link
      href={`/paths/${path.slug}`}
      className={cn(
        "group block border-b border-border py-5 transition-colors hover:bg-surface/60",
        className,
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            {path.category ? (
              <span className="font-mono text-[11px] uppercase tracking-wide text-muted">
                {path.category.name}
              </span>
            ) : null}
            <DifficultyBadge difficulty={path.difficulty} />
          </div>
          <h3 className="text-lg font-semibold text-foreground group-hover:text-accent">
            {path.title}
          </h3>
          <p className="max-w-2xl text-sm text-muted">{path.summary}</p>
          <p className="font-mono text-xs text-faint">
            {path.module_count} modules · {path.lesson_count} lessons ·{" "}
            {path.estimated_minutes} min
          </p>
        </div>
        {path.progress_percent > 0 ? (
          <div className="w-28 shrink-0" aria-label={`${path.progress_percent}% complete`}>
            <div className="mb-1 flex justify-between font-mono text-[11px] text-muted">
              <span>Progress</span>
              <span>{path.progress_percent}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-surface-raised">
              <div
                className="h-full rounded-full bg-accent transition-[width] duration-500"
                style={{ width: `${Math.min(100, path.progress_percent)}%` }}
              />
            </div>
          </div>
        ) : null}
      </div>
    </Link>
  );
}
