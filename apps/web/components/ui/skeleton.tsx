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

export function SkeletonText({
  lines = 3,
  className,
  label = "Loading text",
}: {
  lines?: number;
  className?: string;
  label?: string;
}) {
  return (
    <div className={cn("space-y-2", className)} role="status" aria-live="polite" aria-label={label}>
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className={cn(
            "skeleton-shimmer h-3 rounded",
            index === lines - 1 ? "w-2/3" : index % 2 === 0 ? "w-full" : "w-5/6",
          )}
        />
      ))}
    </div>
  );
}
