"use client";

import { usePrefersReducedMotion } from "@/lib/motion/reduced";
import { cn } from "@/lib/utils";

/**
 * One-shot title treatment for the marketing hero. It does not loop, and it
 * renders the plain word when motion is reduced so the heading stays readable.
 */
export function GlitchText({ text, className }: { text: string; className?: string }) {
  const reduced = usePrefersReducedMotion();
  if (reduced) return <span className={className}>{text}</span>;
  return (
    <span className={cn("relative inline-block", className)}>
      <span className="glitch-base">{text}</span>
      <span aria-hidden="true" className="glitch-slice glitch-slice-a">
        {text}
      </span>
      <span aria-hidden="true" className="glitch-slice glitch-slice-b">
        {text}
      </span>
    </span>
  );
}
