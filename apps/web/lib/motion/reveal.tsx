"use client";

import { useEffect, useRef, useState } from "react";
import { usePrefersReducedMotion } from "@/lib/motion/reduced";
import { cn } from "@/lib/utils";

type RevealTag = "div" | "li" | "section" | "article" | "span";
type RevealDirection = "up" | "down" | "left" | "right" | "none";

function hiddenTransform(direction: RevealDirection, distance: number): string {
  switch (direction) {
    case "down":
      return `translateY(-${distance}px)`;
    case "left":
      return `translateX(${distance}px)`;
    case "right":
      return `translateX(-${distance}px)`;
    case "none":
      return "none";
    default:
      return `translateY(${distance}px)`;
  }
}

/**
 * Fade and transform a block when it enters the viewport. Transform and
 * opacity only; reduced motion shows the final state immediately.
 */
export function Reveal({
  children,
  className,
  delay = 0,
  as: Tag = "div",
  direction = "up",
  distance = 16,
  duration = 560,
  once = true,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  as?: RevealTag;
  direction?: RevealDirection;
  distance?: number;
  duration?: number;
  once?: boolean;
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
          if (once) observer.disconnect();
        } else if (!once) {
          setShown(false);
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [once, reduced]);

  return (
    <Tag
      ref={ref as never}
      className={cn("motion-reduce:transition-none", className)}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "none" : hiddenTransform(direction, distance),
        transitionProperty: "opacity, transform",
        transitionDuration: `${duration}ms`,
        transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
        transitionDelay: visible ? `${delay}ms` : "0ms",
        willChange: visible ? undefined : "opacity, transform",
      }}
    >
      {children}
    </Tag>
  );
}

export function Stagger({
  children,
  className,
  gap = 70,
  direction = "up",
  as = "div",
}: {
  children: React.ReactNode;
  className?: string;
  gap?: number;
  direction?: RevealDirection;
  as?: RevealTag;
}) {
  return (
    <Tag className={className} as={as}>
      {Array.isArray(children)
        ? children.map((child, index) => (
            <Reveal key={index} delay={index * gap} direction={direction} as={as === "div" ? "div" : as}>
              {child}
            </Reveal>
          ))
        : children}
    </Tag>
  );
}

function Tag({ as, className, children }: { as: RevealTag; className?: string; children: React.ReactNode }) {
  if (as === "li") return <ul className={className}>{children}</ul>;
  if (as === "section") return <section className={className}>{children}</section>;
  if (as === "article") return <article className={className}>{children}</article>;
  if (as === "span") return <span className={className}>{children}</span>;
  return <div className={className}>{children}</div>;
}
