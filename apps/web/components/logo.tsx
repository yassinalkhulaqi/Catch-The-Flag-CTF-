import { cn } from "@/lib/utils";

/** CTF flag-marker mark + wordmark. */
export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        className="shrink-0"
      >
        <path d="M5 3v18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path
          d="M5 4.5h11l-2.2 3.75L16 12H5.5"
          fill="var(--accent)"
          stroke="var(--accent)"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
      <span className="font-mono text-sm font-semibold tracking-tight">
        catch<span className="text-accent">the</span>flag
      </span>
    </span>
  );
}
