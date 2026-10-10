"use client";

import { useRef } from "react";
import { usePrefersReducedMotion } from "@/lib/motion/reduced";
import { cn } from "@/lib/utils";

/** Slight 3D tilt on pointer move. Resets on leave. Disabled for reduced motion. */
export function TiltCard({
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
    const px = (event.clientX - rect.left) / rect.width - 0.5;
    const py = (event.clientY - rect.top) / rect.height - 0.5;
    ref.current.style.transform = `rotateX(${(-py * 6).toFixed(2)}deg) rotateY(${(px * 6).toFixed(2)}deg)`;
  }

  function reset() {
    if (ref.current) ref.current.style.transform = "rotateX(0deg) rotateY(0deg)";
  }

  return (
    <div className={cn("perspective-[800px]", className)} onPointerLeave={reset}>
      <div
        ref={ref}
        onPointerMove={onMove}
        className="transition-transform duration-150 ease-out motion-reduce:transition-none"
        style={{ transform: "rotateX(0deg) rotateY(0deg)" }}
      >
        {children}
      </div>
    </div>
  );
}
