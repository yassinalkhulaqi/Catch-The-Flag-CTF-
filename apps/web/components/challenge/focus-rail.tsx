"use client";

import { FocusProgress } from "@/components/challenge/focus-progress";
import { SolveChecklist } from "@/components/challenge/solve-checklist";
import type { FocusSection } from "@/lib/challenge/focus";
import type { Dictionary } from "@/lib/i18n/en";
import { cn } from "@/lib/utils";

export function FocusRail({
  sections,
  activeSection,
  completed,
  progress,
  onJump,
  onToggle,
  copy,
}: {
  sections: FocusSection[];
  activeSection: string;
  completed: readonly string[];
  progress: { count: number; total: number; percent: number };
  onJump: (section: FocusSection) => void;
  onToggle: (key: string) => void;
  copy: Dictionary["focus"];
}) {
  return (
    <div className="space-y-5">
      <div>
        <p className="type-eyebrow text-accent">{copy.rail}</p>
        <nav aria-label={copy.rail} className="mt-2">
          <ol className="space-y-0.5">
            {sections.map((section, index) => {
              const current = activeSection === section.key;
              return (
                <li key={section.key}>
                  <button
                    type="button"
                    onClick={() => onJump(section)}
                    aria-current={current ? "location" : undefined}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-start text-xs transition-colors",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60",
                      current
                        ? "bg-accent/10 text-accent"
                        : "text-muted hover:bg-surface hover:text-foreground",
                    )}
                  >
                    <span className="inline-flex size-5 shrink-0 items-center justify-center rounded border border-border font-mono text-[10px]">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="min-w-0 truncate">{section.label}</span>
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>
      </div>

      <div className="border-t border-border pt-4">
        <p className="type-eyebrow text-faint">{copy.checklist}</p>
        <div className="mt-2">
          <SolveChecklist
            sections={sections}
            completed={completed}
            activeSection={activeSection}
            onToggle={onToggle}
            label={copy.checklist}
          />
        </div>
      </div>

      <FocusProgress
        count={progress.count}
        total={progress.total}
        percent={progress.percent}
        label={copy.reviewed}
        completeLabel={copy.complete}
        className="border-t border-border pt-4"
      />

      <p className="text-[10px] leading-relaxed text-faint">{copy.tip}</p>
    </div>
  );
}
