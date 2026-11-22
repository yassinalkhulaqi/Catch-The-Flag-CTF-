"use client";

import { Clock3 } from "lucide-react";
import { formatElapsed } from "@/lib/challenge/focus";
import { cn } from "@/lib/utils";

export function SessionTimer({
  seconds,
  label,
  className,
}: {
  seconds: number;
  label: string;
  className?: string;
}) {
  const elapsed = formatElapsed(seconds);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-mono text-xs tabular-nums text-muted",
        className,
      )}
      title={label}
    >
      <Clock3 aria-hidden="true" className="size-3.5 text-accent" />
      <span aria-label={`${label} ${elapsed}`}>{elapsed}</span>
    </span>
  );
}
