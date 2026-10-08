import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ChallengeHint } from "@/lib/types";

export function HintsStep({
  id,
  hints,
  content,
  cost,
  pending,
  onContent,
  onCost,
  onAdd,
  onDelete,
}: {
  id: string;
  hints: ChallengeHint[];
  content: string;
  cost: string;
  pending: boolean;
  onContent: (value: string) => void;
  onCost: (value: string) => void;
  onAdd: () => void;
  onDelete: (hintId: number) => void;
}) {
  return (
    <section className="space-y-3" aria-labelledby={`${id}-hints`}>
      <h2 id={`${id}-hints`} className="font-mono text-xs uppercase tracking-[0.16em] text-accent">
        Hints
      </h2>
      <div className="grid gap-3 md:grid-cols-[1fr_120px_auto]">
        <Input
          placeholder="Hint content"
          value={content}
          onChange={(e) => onContent(e.target.value)}
          aria-label="Hint content"
        />
        <Input
          type="number"
          min={0}
          value={cost}
          onChange={(e) => onCost(e.target.value)}
          aria-label="Hint cost"
        />
        <Button type="button" onClick={onAdd} disabled={pending}>
          Add hint
        </Button>
      </div>
      <ul className="space-y-2">
        {hints.length === 0 ? <li className="text-sm text-muted">No hints yet.</li> : null}
        {hints.map((hint) => (
          <li key={hint.id} className="flex items-start justify-between gap-3 border border-border p-3 text-sm">
            <div>
              <p className="font-mono text-xs text-faint">
                #{hint.position} · −{hint.cost_points} pts
              </p>
              <p className="mt-1">{hint.content}</p>
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={() => onDelete(hint.id)} disabled={pending}>
              Delete
            </Button>
          </li>
        ))}
      </ul>
    </section>
  );
}
