import { cn } from "@/lib/utils";

/**
 * CSS-only looping strip. The track is duplicated so the -50% translate lands
 * on an identical frame; the second copy stays out of the accessibility tree.
 */
export function Marquee({
  children,
  className,
  speed = 34,
}: {
  children: React.ReactNode;
  className?: string;
  speed?: number;
}) {
  return (
    <div className={cn("marquee", className)}>
      <div
        className="marquee-track items-center gap-3"
        style={{ animationDuration: `${speed}s` }}
      >
        <div className="flex shrink-0 items-center gap-3">{children}</div>
        <div aria-hidden="true" className="flex shrink-0 items-center gap-3">
          {children}
        </div>
      </div>
    </div>
  );
}
