"use client";

import { useEffect, useState } from "react";
import { usePrefersReducedMotion } from "@/lib/motion/reduced";
import { formatXp } from "@/lib/utils";

/** Counts an integer with requestAnimationFrame. Reduced motion jumps to the end. */
export function CountUp({
  value,
  duration = 700,
  className,
  suffix,
}: {
  value: number;
  duration?: number;
  className?: string;
  suffix?: string;
}) {
  const reduced = usePrefersReducedMotion();
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (reduced) return;
    let frame = 0;
    const start = performance.now();
    const from = 0;
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(from + (value - from) * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, duration, reduced]);

  return (
    <span className={className}>
      {formatXp(reduced ? value : display)}
      {suffix}
    </span>
  );
}
