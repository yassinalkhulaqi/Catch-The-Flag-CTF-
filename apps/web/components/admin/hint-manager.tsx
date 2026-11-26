"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { hintCreateSchema, type HintCreateInput } from "@/lib/admin/schemas";
import {
  createAdminChallengeHint,
  deleteAdminChallengeHint,
  updateAdminChallengeHint,
  type AdminHint,
} from "@/lib/api/admin";
import { Button } from "@/components/ui/button";
import { Form, FormError } from "@/components/ui/form";
import { Field, Input, Textarea } from "@/components/ui/input";

function toInput(hint: AdminHint): HintCreateInput {
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

  const createForm = useForm<HintCreateInput>({
    resolver: zodResolver(hintCreateSchema),
    defaultValues: {
      content: "",
      cost_points: 10,
      position: (initialHints.length || 0) + 1,
    },
  });

  async function onCreate(values: HintCreateInput) {
    if (pending) return;
    setPending(true);
    setError(null);
    const result = await createAdminChallengeHint(challengeId, {
      ...values,
      content: values.content.trim(),
    });
    setPending(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setHints((prev) => [...prev, result.data].sort((a, b) => a.position - b.position));
    createForm.reset({
      content: "",
      cost_points: values.cost_points,
      position: values.position + 1,
    });
    router.refresh();
  }

  async function onSave(hintId: number, values: HintCreateInput) {
    if (pending) return;
    setPending(true);
    setError(null);
    const result = await updateAdminChallengeHint(challengeId, hintId, {
      ...values,
      content: values.content.trim(),
    });
    setPending(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setHints((prev) =>
      prev.map((h) => (h.id === hintId ? result.data : h)).sort((a, b) => a.position - b.position),
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
      <FormError className="mb-3">{error}</FormError>

      {hints.length === 0 ? (
        <p className="text-sm text-muted">No hints yet.</p>
      ) : (
        <ul className="space-y-2">
          {hints.map((hint) =>
            editingId === hint.id ? (
              <li key={hint.id} className="rounded-md border border-border bg-surface-raised p-3">
                <HintEditor
                  hint={hint}
                  pending={pending}
                  onCancel={() => setEditingId(null)}
                  onSave={(values) => void onSave(hint.id, values)}
                />
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
                  {hint.content ? <span className="block truncate text-muted">{hint.content}</span> : null}
                </span>
                <span className="flex gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={pending}
                    onClick={() => {
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

      <Form
        label="Add hint"
        className="mt-4 rounded-md border border-border p-3"
        pending={pending || createForm.formState.isSubmitting}
        onSubmit={createForm.handleSubmit(onCreate)}
      >
        <p className="text-sm font-medium text-foreground">Add hint</p>
        <div className="mt-3 grid gap-3">
          <Field label="Hint content" htmlFor="new-hint-content" error={createForm.formState.errors.content?.message}>
            <Textarea
              id="new-hint-content"
              rows={2}
              placeholder="Nudge toward the right tool or offset…"
              {...createForm.register("content")}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Cost (points)" htmlFor="new-hint-cost" error={createForm.formState.errors.cost_points?.message}>
              <Input id="new-hint-cost" type="number" min={0} step={1} {...createForm.register("cost_points", { valueAsNumber: true })} />
            </Field>
            <Field label="Position" htmlFor="new-hint-position" error={createForm.formState.errors.position?.message}>
              <Input id="new-hint-position" type="number" min={0} step={1} {...createForm.register("position", { valueAsNumber: true })} />
            </Field>
          </div>
          <Button type="submit" size="sm" loading={pending || createForm.formState.isSubmitting}>
            Add hint
          </Button>
        </div>
      </Form>
    </div>
  );
}

function HintEditor({
  hint,
  pending,
  onSave,
  onCancel,
}: {
  hint: AdminHint;
  pending: boolean;
  onSave: (values: HintCreateInput) => void;
  onCancel: () => void;
}) {
  const form = useForm<HintCreateInput>({
    resolver: zodResolver(hintCreateSchema),
    defaultValues: toInput(hint),
  });

  return (
    <Form label="Edit hint" className="grid gap-3" pending={form.formState.isSubmitting} onSubmit={form.handleSubmit(onSave)}>
      <Field label="Hint content" htmlFor={`hint-content-${hint.id}`} error={form.formState.errors.content?.message}>
        <Textarea id={`hint-content-${hint.id}`} rows={3} {...form.register("content")} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Cost (points)" htmlFor={`hint-cost-${hint.id}`} error={form.formState.errors.cost_points?.message}>
          <Input id={`hint-cost-${hint.id}`} type="number" min={0} step={1} {...form.register("cost_points", { valueAsNumber: true })} />
        </Field>
        <Field label="Position" htmlFor={`hint-position-${hint.id}`} error={form.formState.errors.position?.message}>
          <Input id={`hint-position-${hint.id}`} type="number" min={0} step={1} {...form.register("position", { valueAsNumber: true })} />
        </Field>
      </div>
      <div className="flex gap-2">
        <Button type="submit" size="sm" loading={form.formState.isSubmitting || pending}>
          Save hint
        </Button>
        <Button type="button" size="sm" variant="ghost" disabled={pending} onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </Form>
  );
}
