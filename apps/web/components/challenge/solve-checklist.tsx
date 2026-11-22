"use client";

import { Check } from "lucide-react";
import type { FocusSection } from "@/lib/challenge/focus";
import { cn } from "@/lib/utils";

export function SolveChecklist({
  sections,
  completed,
  activeSection,
  onToggle,
  label,
}: {
  sections: FocusSection[];
  completed: readonly string[];
  activeSection: string;
  onToggle: (key: string) => void;
  label: string;
}) {
  return (
    <ul className="space-y-0.5" aria-label={label}>
      {sections.map((section) => {
        const done = completed.includes(section.key);
        const current = activeSection === section.key;
        return (
          <li key={section.key}>
            <label
              className={cn(
                "flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-xs transition-colors",
                current ? "bg-accent/10 text-accent" : "text-muted hover:bg-surface hover:text-foreground",
                done && "text-foreground",
              )}
            >
              <input
                type="checkbox"
                checked={done}
                onChange={() => onToggle(section.key)}
                className="size-3.5 shrink-0 cursor-pointer accent-[var(--accent)]"
              />
              <span className="min-w-0 flex-1 truncate">{section.label}</span>
              {done ? (
                <Check aria-hidden="true" className="size-3 shrink-0 text-success" />
              ) : null}
            </label>
          </li>
        );
      })}
    </ul>
  );
}
