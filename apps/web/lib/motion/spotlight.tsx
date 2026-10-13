"use client";

import { useRef } from "react";
import { usePrefersReducedMotion } from "@/lib/motion/reduced";
import { cn } from "@/lib/utils";

/** Follows the pointer with a soft amber wash. Static when motion is reduced. */
export function SpotlightCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();

  function onMove(event: React.PointerEvent<HTMLDivElement>) {
    if (reduced || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    ref.current.style.setProperty("--spot-x", `${event.clientX - rect.left}px`);
    ref.current.style.setProperty("--spot-y", `${event.clientY - rect.top}px`);
  }

  return (
    <div
      ref={ref}
      onPointerMove={onMove}
      className={cn(
        "spotlight-card relative overflow-hidden rounded-xl border border-border bg-surface",
        className,
      )}
    >
      {children}
    </div>
  );
}
