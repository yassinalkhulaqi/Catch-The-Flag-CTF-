"use client";

import { useEffect, useState } from "react";

/**
 * Thin reading-progress rail pinned above the header. It observes scroll with
 * rAF throttling and only ever scales a transform, so it stays cheap on long
 * catalog pages.
 */
export function ScrollProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let frame = 0;

    function measure() {
      const root = document.documentElement;
      const max = root.scrollHeight - root.clientHeight;
      setProgress(max <= 0 ? 0 : Math.min(1, Math.max(0, root.scrollTop / max)));
    }

    function schedule() {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    }

    measure();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      data-testid="scroll-progress"
      className="pointer-events-none fixed inset-x-0 top-0 z-[90] h-0.5 bg-transparent"
    >
      <div
        className="h-full origin-left bg-[image:var(--accent-gradient)] transition-transform duration-150 ease-out motion-reduce:transition-none"
        style={{ transform: `scaleX(${progress})` }}
      />
    </div>
  );
}
