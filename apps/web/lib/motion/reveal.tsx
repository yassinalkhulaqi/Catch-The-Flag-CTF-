"use client";

import { useEffect, useRef, useState } from "react";
import { usePrefersReducedMotion } from "@/lib/motion/reduced";
import { cn } from "@/lib/utils";

/** Fade and rise when the block enters the viewport. Transform and opacity only. */
export function Reveal({
  children,
  className,
  delay = 0,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  as?: "div" | "li" | "section" | "article";
}) {
  const ref = useRef<HTMLElement | null>(null);
  const reduced = usePrefersReducedMotion();
  const [shown, setShown] = useState(false);
  const visible = reduced || shown;

  useEffect(() => {
    if (reduced) return;
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setShown(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [reduced]);

  return (
    <Tag
      ref={ref as never}
      className={cn("transition-[opacity,transform] duration-500 ease-out motion-reduce:transition-none", className)}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(12px)",
        transitionDelay: visible ? `${delay}ms` : "0ms",
      }}
    >
      {children}
    </Tag>
  );
}

export function Stagger({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      {Array.isArray(children)
        ? children.map((child, index) => (
            <Reveal key={index} delay={index * 60}>
              {child}
            </Reveal>
          ))
        : children}
    </div>
  );
}
