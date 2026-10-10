import { Markdown } from "@/components/markdown";
import { Button } from "@/components/ui/button";
import { Field, Textarea } from "@/components/ui/input";

export function ScenarioStep({
  id,
  scenario,
  description,
  isEdit,
  pending,
  onScenario,
  onDescription,
  onSave,
}: {
  id: string;
  scenario: string;
  description: string;
  isEdit: boolean;
  pending: boolean;
  onScenario: (value: string) => void;
  onDescription: (value: string) => void;
  onSave: () => void;
}) {
  return (
    <section className="space-y-4" aria-labelledby={`${id}-scenario`}>
      <h2 id={`${id}-scenario`} className="font-mono text-xs uppercase tracking-[0.16em] text-accent">
        Scenario
      </h2>
      <Field label="Scenario" htmlFor={`${id}-scenario-body`}>
        <Textarea id={`${id}-scenario-body`} value={scenario} onChange={(e) => onScenario(e.target.value)} />
      </Field>
      <div className="grid gap-4 lg:grid-cols-2">
        <Field label="Description (Markdown)" htmlFor={`${id}-description`}>
          <Textarea
            id={`${id}-description`}
            className="min-h-40 font-mono"
            value={description}
            onChange={(e) => onDescription(e.target.value)}
            required
          />
        </Field>
        <div className="rounded-lg border border-border bg-background p-4">
          <p className="mb-2 font-mono text-[11px] uppercase tracking-wide text-faint">Learner preview</p>
          {description.trim() ? (
            <Markdown content={description} />
          ) : (
            <p className="text-sm text-muted">The description preview appears here as you type.</p>
          )}
        </div>
      </div>
      <Button type="button" onClick={onSave} disabled={pending}>
        {pending ? "Saving…" : isEdit ? "Save scenario" : "Create challenge"}
      </Button>
    </section>
  );
}
