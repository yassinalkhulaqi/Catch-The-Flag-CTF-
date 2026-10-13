import { cn } from "@/lib/utils";

/** CSS tooltip. The child must be focusable for keyboard access. */
export function Tooltip({
  content,
  children,
  className,
}: {
  content: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span className={cn("group relative inline-flex", className)}>
      {children}
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full start-1/2 z-50 mb-2 w-max max-w-56 -translate-x-1/2 rounded-md border border-border bg-surface-overlay px-2 py-1 text-xs text-foreground opacity-0 shadow-md transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 rtl:translate-x-1/2"
      >
        {content}
      </span>
    </span>
  );
}
