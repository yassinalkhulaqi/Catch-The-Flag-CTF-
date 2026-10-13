"use client";

import { useRef } from "react";
import { usePrefersReducedMotion } from "@/lib/motion/reduced";

/** Pulls a control a few pixels toward the pointer. Transform only. */
export function Magnetic({
  children,
  className,
  strength = 8,
}: {
  children: React.ReactNode;
  className?: string;
  strength?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduced = usePrefersReducedMotion();

  function onMove(event: React.PointerEvent<HTMLSpanElement>) {
    if (reduced || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = event.clientX - (rect.left + rect.width / 2);
    const y = event.clientY - (rect.top + rect.height / 2);
    ref.current.style.transform = `translate(${(x / rect.width) * strength}px, ${(y / rect.height) * strength}px)`;
  }

  function reset() {
    if (ref.current) ref.current.style.transform = "translate(0px, 0px)";
  }

  return (
    <span
      ref={ref}
      className={className}
      onPointerMove={onMove}
      onPointerLeave={reset}
      style={{ display: "inline-flex", transition: "transform 160ms cubic-bezier(0.16, 1, 0.3, 1)" }}
    >
      {children}
    </span>
  );
}
