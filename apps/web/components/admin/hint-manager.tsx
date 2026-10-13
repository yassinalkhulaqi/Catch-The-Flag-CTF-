"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";
import {
  createAdminChallengeHint,
  deleteAdminChallengeHint,
  updateAdminChallengeHint,
  type AdminHint,
  type AdminHintInput,
} from "@/lib/api/admin";

function toInput(hint: AdminHint): AdminHintInput {
  return {
    content: hint.content ?? "",
    cost_points: hint.cost_points,
    position: hint.position,
  };
}

/** Hint CRUD manager (content, cost, ordering). */
export function HintManager({
  challengeId,
  initialHints,
}: {
  challengeId: number;
  initialHints: AdminHint[];
}) {
  const router = useRouter();
  const [hints, setHints] = useState<AdminHint[]>(
    [...initialHints].sort((a, b) => a.position - b.position),
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draft, setDraft] = useState<AdminHintInput>({
    content: "",
    cost_points: 0,
    position: 1,
  });
  const [creating, setCreating] = useState<AdminHintInput>({
    content: "",
    cost_points: 10,
    position: (initialHints.length || 0) + 1,
  });

  function validate(input: AdminHintInput): string | null {
    if (!input.content.trim()) return "Hint content is required.";
    if (!Number.isInteger(input.cost_points) || input.cost_points < 0) {
      return "Cost must be a whole number of points (0 or more).";
    }
    if (!Number.isInteger(input.position) || input.position < 1) {
      return "Position must start at 1.";
    }
    return null;
  }

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    if (pending) return;
    const problem = validate(creating);
    if (problem) {
      setError(problem);
      return;
    }
    setPending(true);
    setError(null);
    const result = await createAdminChallengeHint(challengeId, {
      ...creating,
      content: creating.content.trim(),
    });
    setPending(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setHints((prev) =>
      [...prev, result.data].sort((a, b) => a.position - b.position),
    );
    setCreating((prev) => ({
      content: "",
      cost_points: prev.cost_points,
      position: prev.position + 1,
    }));
    router.refresh();
  }

  async function onSave(hintId: number) {
    if (pending) return;
    const problem = validate(draft);
    if (problem) {
      setError(problem);
      return;
    }
    setPending(true);
    setError(null);
    const result = await updateAdminChallengeHint(challengeId, hintId, {
      ...draft,
      content: draft.content.trim(),
    });
    setPending(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setHints((prev) =>
      prev
        .map((h) => (h.id === hintId ? result.data : h))
        .sort((a, b) => a.position - b.position),
    );
    setEditingId(null);
    router.refresh();
  }

  async function onDelete(hintId: number) {
    if (pending) return;
    setPending(true);
    setError(null);
    const result = await deleteAdminChallengeHint(challengeId, hintId);
    setPending(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setHints((prev) => prev.filter((h) => h.id !== hintId));
    router.refresh();
  }

  return (
    <div>
      {error ? (
        <p role="alert" className="mb-3 text-sm text-danger">
          {error}
        </p>
      ) : null}

      {hints.length === 0 ? (
        <p className="text-sm text-muted">No hints yet.</p>
      ) : (
        <ul className="space-y-2">
          {hints.map((hint) =>
            editingId === hint.id ? (
              <li
                key={hint.id}
                className="rounded-md border border-border bg-surface-raised p-3"
              >
                <div className="grid gap-3">
                  <Field label="Hint content" htmlFor={`hint-content-${hint.id}`}>
                    <Textarea
                      id={`hint-content-${hint.id}`}
                      value={draft.content}
                      onChange={(e) =>
                        setDraft((d) => ({ ...d, content: e.target.value }))
                      }
                      rows={3}
                    />
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Cost (points)" htmlFor={`hint-cost-${hint.id}`}>
                      <Input
                        id={`hint-cost-${hint.id}`}
                        type="number"
                        min={0}
                        step={1}
                        value={draft.cost_points}
                        onChange={(e) =>
                          setDraft((d) => ({
                            ...d,
                            cost_points: Number(e.target.value),
                          }))
                        }
                      />
                    </Field>
                    <Field label="Position" htmlFor={`hint-position-${hint.id}`}>
                      <Input
                        id={`hint-position-${hint.id}`}
                        type="number"
                        min={1}
                        step={1}
                        value={draft.position}
                        onChange={(e) =>
                          setDraft((d) => ({
                            ...d,
                            position: Number(e.target.value),
                          }))
                        }
                      />
                    </Field>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      disabled={pending}
                      onClick={() => onSave(hint.id)}
                    >
                      {pending ? "Saving…" : "Save hint"}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={pending}
                      onClick={() => setEditingId(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </li>
            ) : (
              <li
                key={hint.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border bg-surface-raised px-3 py-2"
              >
                <span className="min-w-0 text-sm">
                  <span className="font-mono text-xs text-accent">
                    #{hint.position} · {hint.cost_points} pts
                  </span>
                  {hint.content ? (
                    <span className="block truncate text-muted">
                      {hint.content}
                    </span>
                  ) : null}
                </span>
                <span className="flex gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={pending}
                    onClick={() => {
                      setDraft(toInput(hint));
                      setEditingId(hint.id);
                      setError(null);
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    disabled={pending}
                    onClick={() => onDelete(hint.id)}
                    aria-label={`Delete hint ${hint.position}`}
                  >
                    Delete
                  </Button>
                </span>
              </li>
            ),
          )}
        </ul>
      )}

      <form
        onSubmit={onCreate}
        className="mt-4 rounded-md border border-border p-3"
        aria-label="Add hint"
      >
        <p className="text-sm font-medium text-foreground">Add hint</p>
        <div className="mt-3 grid gap-3">
          <Field label="Hint content" htmlFor="new-hint-content">
            <Textarea
              id="new-hint-content"
              value={creating.content}
              onChange={(e) =>
                setCreating((c) => ({ ...c, content: e.target.value }))
              }
              rows={2}
              placeholder="Nudge toward the right tool or offset…"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Cost (points)" htmlFor="new-hint-cost">
              <Input
                id="new-hint-cost"
                type="number"
                min={0}
                step={1}
                value={creating.cost_points}
                onChange={(e) =>
                  setCreating((c) => ({
                    ...c,
                    cost_points: Number(e.target.value),
                  }))
                }
              />
            </Field>
            <Field label="Position" htmlFor="new-hint-position">
              <Input
                id="new-hint-position"
                type="number"
                min={1}
                step={1}
                value={creating.position}
                onChange={(e) =>
                  setCreating((c) => ({
                    ...c,
                    position: Number(e.target.value),
                  }))
                }
              />
            </Field>
          </div>
          <div>
            <Button type="submit" size="sm" disabled={pending}>
              {pending ? "Adding…" : "Add hint"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
