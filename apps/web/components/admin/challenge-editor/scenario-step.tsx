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
      <Field label="Description (Markdown)" htmlFor={`${id}-description`}>
        <Textarea
          id={`${id}-description`}
          className="min-h-40"
          value={description}
          onChange={(e) => onDescription(e.target.value)}
          required
        />
      </Field>
      <Button type="button" onClick={onSave} disabled={pending}>
        {pending ? "Saving…" : isEdit ? "Save scenario" : "Create challenge"}
      </Button>
    </section>
  );
}
