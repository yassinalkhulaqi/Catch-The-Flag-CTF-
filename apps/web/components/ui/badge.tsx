import * as React from "react";
import { cn } from "@/lib/utils";

type Tone = "neutral" | "accent" | "success" | "warning" | "danger" | "info";

const tones: Record<Tone, string> = {
  neutral: "border-border text-muted bg-surface-raised",
  accent: "border-accent/40 text-accent bg-accent/10",
  success: "border-success/40 text-success bg-success/10",
  warning: "border-warning/40 text-warning bg-warning/10",
  danger: "border-danger/40 text-danger bg-danger/10",
  info: "border-info/40 text-info bg-info/10",
};

export function Badge({
  tone = "neutral",
  size = "sm",
  dot = false,
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & {
  tone?: Tone;
  size?: "sm" | "md";
  dot?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border font-mono uppercase tracking-wide",
        size === "sm" ? "px-1.5 py-0.5 text-[11px]" : "px-2 py-1 text-xs",
        tones[tone],
        className,
      )}
      {...props}
    >
      {dot ? <span aria-hidden="true" className="size-1.5 rounded-full bg-current" /> : null}
      {children}
    </span>
  );
}

export { Skeleton } from "@/components/ui/skeleton";
