"use client";

import { useId, useState } from "react";
import { cn } from "@/lib/utils";

export interface AccordionItem {
  id: string;
  title: string;
  content: React.ReactNode;
}

export function Accordion({
  items,
  className,
}: {
  items: AccordionItem[];
  className?: string;
}) {
  const [open, setOpen] = useState<string | null>(items[0]?.id ?? null);
  const base = useId();

  return (
    <div className={cn("divide-y divide-border rounded-lg border border-border", className)}>
      {items.map((item) => {
        const expanded = open === item.id;
        const panelId = `${base}-${item.id}`;
        return (
          <div key={item.id}>
            <h3>
              <button
                type="button"
                aria-expanded={expanded}
                aria-controls={panelId}
                className="flex w-full items-center justify-between px-4 py-3 text-start text-sm font-medium"
                onClick={() => setOpen(expanded ? null : item.id)}
              >
                {item.title}
                <span aria-hidden="true" className="font-mono text-xs text-faint">
                  {expanded ? "–" : "+"}
                </span>
              </button>
            </h3>
            <div id={panelId} role="region" hidden={!expanded} className="px-4 pb-4 text-sm text-muted">
              {item.content}
            </div>
          </div>
        );
      })}
    </div>
  );
}
