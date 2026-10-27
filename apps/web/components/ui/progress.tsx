import { cn } from "@/lib/utils";

type Tone = "accent" | "success" | "warning" | "danger" | "info";

const tones: Record<Tone, string> = {
  accent: "bg-[image:var(--accent-gradient)]",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  info: "bg-info",
};

export function Progress({
  value,
  max = 100,
  label,
  tone = "accent",
  size = "md",
  className,
  indicatorClassName,
}: {
  value: number;
  max?: number;
  label: string;
  tone?: Tone;
  size?: "sm" | "md" | "lg";
  className?: string;
  indicatorClassName?: string;
}) {
  const safeMax = max <= 0 ? 1 : max;
  const ratio = Math.min(1, Math.max(0, value / safeMax));
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={safeMax}
      aria-valuenow={Math.round(value)}
      className={cn(
        "overflow-hidden rounded-full bg-surface-raised",
        size === "sm" ? "h-1" : size === "lg" ? "h-2.5" : "h-2",
        className,
      )}
    >
      <div
        className={cn(
          "h-full rounded-full transition-[width] duration-700 ease-out motion-reduce:transition-none",
          tones[tone],
          indicatorClassName,
        )}
        style={{ width: `${ratio * 100}%` }}
      />
    </div>
  );
}
