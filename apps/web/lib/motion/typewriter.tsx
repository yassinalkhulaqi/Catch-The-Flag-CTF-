"use client";

import { useEffect, useState } from "react";
import { usePrefersReducedMotion } from "@/lib/motion/reduced";

/** Types a line, then holds. Reduced motion shows the full line immediately. */
export function Typewriter({
  lines,
  className,
}: {
  lines: string[];
  className?: string;
}) {
  const reduced = usePrefersReducedMotion();
  const [lineIndex, setLineIndex] = useState(0);
  const [count, setCount] = useState(0);
  const line = lines[lineIndex] ?? "";
  const visible = reduced ? line : line.slice(0, count);

  useEffect(() => {
    if (reduced) return;
    if (count < line.length) {
      const timer = window.setTimeout(() => setCount((value) => value + 1), 28);
      return () => window.clearTimeout(timer);
    }
    if (lines.length < 2) return;
    const hold = window.setTimeout(() => {
      setLineIndex((index) => (index + 1) % lines.length);
      setCount(0);
    }, 1600);
    return () => window.clearTimeout(hold);
  }, [count, line, lines.length, reduced]);

  return (
    <p className={className} aria-label={line}>
      <span aria-hidden="true">{visible}</span>
      {reduced ? null : <span aria-hidden="true" className="caret" />}
    </p>
  );
}
