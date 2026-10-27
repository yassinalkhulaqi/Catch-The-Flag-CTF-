"use client";

import { useEffect, useState } from "react";

/** Tracks whether the page has scrolled past a small threshold. */
export function useScrolled(threshold = 8): boolean {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    let frame = 0;

    function measure() {
      setScrolled(window.scrollY > threshold);
    }

    function schedule() {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    }

    measure();
    window.addEventListener("scroll", schedule, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
    };
  }, [threshold]);

  return scrolled;
}
