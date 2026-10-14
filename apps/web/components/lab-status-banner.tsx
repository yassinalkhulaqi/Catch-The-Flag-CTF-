import { cn } from "@/lib/utils";

/**
 * PortSwigger-style lab status banner.
 * Server Component — pure presentational, no client JS.
 */
export function LabStatusBanner({ solved, points }: { solved: boolean; points: number }) {
  return (
    <div
      role="status"
      aria-live="polite"
      data-testid="lab-status-banner"
      className={cn(
        "flex items-center justify-between gap-3 rounded-md border px-3 py-2 font-mono text-xs tracking-wide",
        solved
          ? "animate-pulse border-success/60 bg-success/10 text-success shadow-[var(--glow-success)] motion-reduce:animate-none"
          : "border-danger/40 bg-danger/10 text-danger/90",
      )}
    >
      <span data-testid="lab-status-text">{solved ? "[ SOLVED ]" : "[ NOT SOLVED ]"}</span>
      <span data-testid="lab-status-points" className={solved ? "text-success" : "text-accent"}>
        {points} pts
      </span>
    </div>
  );
}
