"use client";

import { useEffect, useState } from "react";

export function ReadingProgress() {
  const [ratio, setRatio] = useState(0);

  useEffect(() => {
    function onScroll() {
      const height = document.documentElement.scrollHeight - window.innerHeight;
      setRatio(height <= 0 ? 0 : Math.min(1, window.scrollY / height));
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className="fixed inset-x-0 top-14 z-30 h-0.5"
      role="progressbar"
      aria-label="Reading progress"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(ratio * 100)}
    >
      <div className="h-full bg-accent" style={{ width: `${ratio * 100}%` }} />
    </div>
  );
}

export function LessonToc({
  items,
}: {
  items: Array<{ id: string; text: string; depth: number }>;
}) {
  if (items.length === 0) return null;
  return (
    <nav aria-label="On this page" className="rounded-xl border border-border bg-surface p-4">
      <p className="type-eyebrow text-accent">On this page</p>
      <ol className="mt-3 space-y-2 text-sm">
        {items.map((item) => (
          <li key={item.id} className={item.depth > 2 ? "ps-3" : undefined}>
            <a href={`#${item.id}`} className="text-muted hover:text-foreground">
              {item.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
