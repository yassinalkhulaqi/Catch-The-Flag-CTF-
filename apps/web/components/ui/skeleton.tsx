import { cn } from "@/lib/utils";

export function Skeleton({
  className,
  label = "Loading",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <div
      className={cn("skeleton-shimmer rounded-md", className)}
      role="status"
      aria-live="polite"
      aria-label={label}
    />
  );
}
