import { ShieldAlert, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * PortSwigger-style lab status banner.
 * Server Component — pure presentational, no client JS.
 */
export function LabStatusBanner({ solved, points }: { solved: boolean; points: number }) {
  const Icon = solved ? ShieldCheck : ShieldAlert;
  return (
    <div
      role="status"
      aria-live="polite"
      data-testid="lab-status-banner"
      className={cn(
        "flex items-center justify-between gap-3 rounded-xl border px-4 py-3 font-mono text-xs tracking-wide",
        solved
          ? "border-success/60 bg-success/10 text-success shadow-[var(--glow-success)]"
          : "border-danger/40 bg-danger/10 text-danger/90",
      )}
    >
      <span className="inline-flex items-center gap-2">
        <span
          aria-hidden="true"
          className={cn("size-1.5 rounded-full", solved ? "bg-success animate-pulse-soft" : "bg-danger")}
        />
        <Icon aria-hidden="true" className="size-4" />
        <span data-testid="lab-status-text">{solved ? "[ SOLVED ]" : "[ NOT SOLVED ]"}</span>
      </span>
      <span data-testid="lab-status-points" className={solved ? "text-success" : "text-accent"}>
        {points} pts
      </span>
    </div>
  );
}
