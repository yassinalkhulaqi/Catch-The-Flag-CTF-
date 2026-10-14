"use client";

import { useId, useState } from "react";
import { Accordion } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { MarkdownContent } from "@/lib/markdown";
import { cn } from "@/lib/utils";

/**
 * Official solution walkthrough island.
 * Gated behind an inline spoiler confirmation (never `window.confirm`).
 * The walkthrough markdown renders only after explicit confirmation, and the
 * preview carries a `spoiler-blur` class until confirmed.
 */
export function SolutionWalkthrough({ walkthrough }: { walkthrough: string }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const panelId = `solution-walkthrough-panel-${uid}`;
  const [phase, setPhase] = useState<"hidden" | "confirming" | "revealed">("hidden");

  if (phase === "hidden") {
    return (
      <div data-testid="solution-walkthrough" className="rounded-xl border border-border bg-surface p-5">
        <h2 className="type-eyebrow text-accent">Official solution</h2>
        <p className="mt-2 text-sm text-muted">
          Stuck? The official walkthrough reveals the intended solve path.
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-3"
          aria-expanded={false}
          aria-controls={panelId}
          data-testid="solution-walkthrough-reveal"
          onClick={() => setPhase("confirming")}
        >
          Reveal official solution walkthrough
        </Button>
      </div>
    );
  }

  if (phase === "confirming") {
    return (
      <div data-testid="solution-walkthrough" className="rounded-xl border border-warning/40 bg-surface p-5">
        <h2 className="type-eyebrow text-warning">Confirm spoiler</h2>
        <div
          role="alertdialog"
          aria-modal="false"
          aria-labelledby={`solution-confirm-title-${uid}`}
          aria-describedby={`solution-confirm-desc-${uid}`}
          className="mt-2"
        >
          <p
            id={`solution-confirm-title-${uid}`}
            className="text-sm font-semibold text-foreground"
          >
            Reveal the official solution?
          </p>
          <p id={`solution-confirm-desc-${uid}`} className="mt-1 text-sm text-muted">
            This will spoil the challenge. Only continue if you are ready to see the
            intended solve steps.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              data-testid="solution-walkthrough-confirm"
              onClick={() => setPhase("revealed")}
            >
              Yes, reveal solution
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              data-testid="solution-walkthrough-cancel"
              onClick={() => setPhase("hidden")}
            >
              Keep trying
            </Button>
          </div>
        </div>

        {/* Blurred preview — spoiler-blur stays until the user confirms. */}
        <div
          aria-hidden="true"
          data-testid="solution-walkthrough-preview"
          className={cn(
            "spoiler-blur mt-4 max-h-24 overflow-hidden rounded-lg border border-border p-3 blur-sm select-none",
          )}
        >
          <MarkdownContent content={walkthrough} />
        </div>
      </div>
    );
  }

  return (
    <div data-testid="solution-walkthrough" className="rounded-xl border border-border bg-surface p-5">
      <h2 className="type-eyebrow text-accent">Official solution</h2>
      <div id={panelId} className="mt-3">
        <Accordion
          items={[
            {
              id: "official-walkthrough",
              title: "Official walkthrough",
              content: (
                <div data-testid="solution-walkthrough-content" aria-live="polite">
                  <MarkdownContent content={walkthrough} />
                </div>
              ),
            },
          ]}
        />
      </div>
      <p className="mt-3 text-xs text-faint">
        Walkthrough revealed. Compare your approach and keep practicing.
      </p>
    </div>
  );
}
