export const fieldControlClass =
  "flex h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground";

export const EDITOR_STEPS = [
  { id: "details", label: "Details" },
  { id: "scenario", label: "Scenario" },
  { id: "files", label: "Files" },
  { id: "hints", label: "Hints" },
  { id: "flag", label: "Flag" },
  { id: "publish", label: "Publish" },
] as const;

export type EditorStep = (typeof EDITOR_STEPS)[number]["id"];

const CREATE_STEPS: EditorStep[] = ["details", "scenario"];

export function stepAvailable(step: EditorStep, isEdit: boolean): boolean {
  return isEdit || CREATE_STEPS.includes(step);
}

export function StepNav({
  current,
  isEdit,
  onSelect,
}: {
  current: EditorStep;
  isEdit: boolean;
  onSelect: (step: EditorStep) => void;
}) {
  return (
    <nav aria-label="Challenge authoring steps">
      <ol className="flex flex-wrap gap-2">
        {EDITOR_STEPS.map((step, index) => {
          const available = stepAvailable(step.id, isEdit);
          const selected = current === step.id;
          return (
            <li key={step.id}>
              <button
                type="button"
                disabled={!available}
                aria-current={selected ? "step" : undefined}
                onClick={() => onSelect(step.id)}
                className={
                  selected
                    ? "border border-accent bg-accent/10 px-3 py-1.5 text-sm text-accent"
                    : "border border-border px-3 py-1.5 text-sm text-muted enabled:hover:text-foreground disabled:opacity-40"
                }
              >
                <span className="me-2 font-mono text-xs">{index + 1}</span> {step.label}
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
