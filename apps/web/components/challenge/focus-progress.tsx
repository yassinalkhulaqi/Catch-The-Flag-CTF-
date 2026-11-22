"use client";

import { CheckCircle2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export function FocusProgress({
  count,
  total,
  percent,
  label,
  completeLabel,
  className,
}: {
  count: number;
  total: number;
  percent: number;
  label: string;
  completeLabel: string;
  className?: string;
}) {
  const complete = total > 0 && count === total;
  return (
    <div className={cn("min-w-0", className)}>
      <div className="flex items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-1.5 font-mono text-[10px] uppercase tracking-wide text-faint">
          {complete ? (
            <CheckCircle2 aria-hidden="true" className="size-3 shrink-0 text-success" />
          ) : null}
          <span className="truncate">{label}</span>
        </span>
        <span className="shrink-0 font-mono text-xs tabular-nums text-foreground">
          {count}/{total}
        </span>
      </div>
      <Progress value={percent} max={100} size="sm" label={label} className="mt-1.5" />
      {complete ? <p className="mt-1 text-[10px] text-success">{completeLabel}</p> : null}
    </div>
  );
}
