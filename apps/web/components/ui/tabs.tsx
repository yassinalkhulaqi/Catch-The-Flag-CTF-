"use client";

import { useId, useState } from "react";
import { cn } from "@/lib/utils";

export interface TabItem {
  id: string;
  label: string;
  panel: React.ReactNode;
}

export function Tabs({
  items,
  label,
  defaultId,
  className,
}: {
  items: TabItem[];
  label: string;
  defaultId?: string;
  className?: string;
}) {
  const auto = useId();
  const [current, setCurrent] = useState(defaultId ?? items[0]?.id ?? "");

  function onKeyDown(event: React.KeyboardEvent) {
    const index = items.findIndex((item) => item.id === current);
    if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      event.preventDefault();
      const direction = event.key === "ArrowRight" ? 1 : -1;
      const next = items[(index + direction + items.length) % items.length];
      if (next) setCurrent(next.id);
    }
    if (event.key === "Home") {
      event.preventDefault();
      setCurrent(items[0]?.id ?? "");
    }
    if (event.key === "End") {
      event.preventDefault();
      setCurrent(items[items.length - 1]?.id ?? "");
    }
  }

  return (
    <div className={className}>
      <div role="tablist" aria-label={label} className="flex gap-1 border-b border-border" onKeyDown={onKeyDown}>
        {items.map((item) => {
          const selected = item.id === current;
          return (
            <button
              key={item.id}
              id={`${auto}-${item.id}`}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={`${auto}-${item.id}-panel`}
              tabIndex={selected ? 0 : -1}
              className={cn(
                "border-b-2 px-3 py-2 text-sm",
                selected ? "border-accent text-foreground" : "border-transparent text-muted hover:text-foreground",
              )}
              onClick={() => setCurrent(item.id)}
            >
              {item.label}
            </button>
          );
        })}
      </div>
      {items.map((item) => (
        <div
          key={item.id}
          role="tabpanel"
          id={`${auto}-${item.id}-panel`}
          aria-labelledby={`${auto}-${item.id}`}
          hidden={item.id !== current}
          tabIndex={0}
          className="pt-4"
        >
          {item.panel}
        </div>
      ))}
    </div>
  );
}
