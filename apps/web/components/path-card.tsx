import Link from "next/link";
import { ArrowUpRight, BookOpen, Clock3, Layers } from "lucide-react";
import { DifficultyBadge } from "@/components/difficulty-badge";
import { cn } from "@/lib/utils";
import type { PathSummary } from "@/lib/types";

export function PathCard({
  path,
  variant = "row",
  className,
}: {
  path: PathSummary;
  variant?: "row" | "tile";
  className?: string;
}) {
  const tile = variant === "tile";

  return (
    <Link
      href={`/paths/${path.slug}`}
      className={cn(
        "group",
        tile
          ? "flex h-full flex-col gap-4 rounded-2xl border border-border bg-surface p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-accent/30 hover:shadow-[var(--shadow-float)]"
          : "block border-b border-border py-5 transition-colors hover:bg-surface/60",
        className,
      )}
    >
      <div
        className={cn(
          tile ? "flex flex-col gap-3" : "flex flex-wrap items-start justify-between gap-4",
        )}
      >
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            {path.category ? (
              <span className="font-mono text-[11px] uppercase tracking-wide text-muted">
                {path.category.name}
              </span>
            ) : null}
            <DifficultyBadge difficulty={path.difficulty} />
          </div>
          <h3
            className={cn(
              "font-semibold text-foreground transition-colors group-hover:text-accent",
              tile ? "text-lg" : "text-lg",
            )}
          >
            {path.title}
          </h3>
          <p className={cn("text-sm text-muted", tile && "line-clamp-2")}>{path.summary}</p>
          {!tile ? (
            <p className="font-mono text-xs text-faint">
              {path.module_count} modules · {path.lesson_count} lessons ·{" "}
              {path.estimated_minutes} min
            </p>
          ) : null}
        </div>
        {!tile && path.progress_percent > 0 ? (
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

      {tile ? (
        <div className="mt-auto space-y-3 border-t border-border pt-3">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[11px] text-faint">
            <span className="inline-flex items-center gap-1.5">
              <Layers aria-hidden="true" className="size-3" />
              {path.module_count} modules
            </span>
            <span className="inline-flex items-center gap-1.5">
              <BookOpen aria-hidden="true" className="size-3" />
              {path.lesson_count} lessons
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock3 aria-hidden="true" className="size-3" />
              {path.estimated_minutes} min
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-raised">
              <div
                className="h-full rounded-full bg-accent transition-[width] duration-500"
                style={{ width: `${Math.min(100, path.progress_percent)}%` }}
              />
            </div>
            <span className="font-mono text-[11px] text-muted">
              {path.progress_percent > 0 ? `${path.progress_percent}%` : "Not started"}
            </span>
            <ArrowUpRight
              aria-hidden="true"
              className="size-4 text-faint transition-colors group-hover:text-accent"
            />
          </div>
        </div>
      ) : null}
    </Link>
  );
}
