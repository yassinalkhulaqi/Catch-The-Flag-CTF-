import { cn } from "@/lib/utils";

export function Progress({
  value,
  max = 100,
  label,
  className,
}: {
  value: number;
  max?: number;
  label: string;
  className?: string;
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
      className={cn("h-2 overflow-hidden rounded-full bg-surface-raised", className)}
    >
      <div
        className="h-full rounded-full bg-accent"
        style={{ width: `${ratio * 100}%` }}
      />
    </div>
  );
}
