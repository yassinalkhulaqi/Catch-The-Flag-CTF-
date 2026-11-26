"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  flagCreateSchema,
  flagReplaceSchema,
  type FlagCreateInput,
  type FlagReplaceInput,
} from "@/lib/admin/schemas";
import {
  createAdminChallengeFlag,
  updateAdminChallengeFlag,
  type AdminFlagRef,
} from "@/lib/api/admin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Form, FormError } from "@/components/ui/form";
import { Field, Input } from "@/components/ui/input";

/**
 * Flag manager — WRITE-ONLY by design. The list endpoint returns labels and
 * active state only; there is no reveal endpoint, and this component never
 * renders a stored flag value. Submitting a value creates or REPLACES it.
 */
export function FlagManager({
  challengeId,
  initialFlags,
}: {
  challengeId: number;
  initialFlags: AdminFlagRef[];
}) {
  const router = useRouter();
  const [flags, setFlags] = useState<AdminFlagRef[]>(initialFlags);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [replacingId, setReplacingId] = useState<number | null>(null);
  const createForm = useForm<FlagCreateInput>({
    resolver: zodResolver(flagCreateSchema),
    defaultValues: { label: "", flag: "", case_sensitive: true },
  });

  async function onCreate(values: FlagCreateInput) {
    if (pending) return;
    setPending(true);
    setError(null);
    const result = await createAdminChallengeFlag(challengeId, {
      label: values.label.trim(),
      flag: values.flag,
      case_sensitive: values.case_sensitive,
    });
    setPending(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setFlags((prev) => [...prev, result.data]);
    createForm.reset({ label: "", flag: "", case_sensitive: values.case_sensitive });
    router.refresh();
  }

  async function onReplace(flagId: number, currentLabel: string, values: FlagReplaceInput) {
    if (pending) return;
    setPending(true);
    setError(null);
    const result = await updateAdminChallengeFlag(challengeId, flagId, {
      label: currentLabel,
      flag: values.flag,
      case_sensitive: true,
    });
    setPending(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setFlags((prev) => prev.map((f) => (f.id === flagId ? result.data : f)));
    setReplacingId(null);
    router.refresh();
  }

  return (
    <div>
      <div
        className="mb-4 rounded-md border border-accent/40 bg-accent/10 px-3 py-2 text-sm text-accent"
        role="note"
        aria-label="Flag secrecy notice"
      >
        Flags are write-only and stored encrypted — they can never be viewed,
        only replaced. Values never appear in responses, logs, or this UI.
      </div>
      <FormError className="mb-3">{error}</FormError>

      {flags.length === 0 ? (
        <p className="text-sm text-muted">
          No flags configured yet. A challenge needs at least one flag before
          it can be solved.
        </p>
      ) : (
        <ul className="space-y-2">
          {flags.map((flag) => (
            <li key={flag.id} className="rounded-md border border-border bg-surface-raised px-3 py-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-mono text-xs text-foreground">{flag.label}</span>
                <span className="flex items-center gap-2">
                  <Badge tone={flag.is_active ? "success" : "neutral"}>
                    {flag.is_active ? "active" : "inactive"}
                  </Badge>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={pending}
                    onClick={() => {
                      setReplacingId(replacingId === flag.id ? null : flag.id);
                      setError(null);
                    }}
                    aria-expanded={replacingId === flag.id}
                  >
                    {replacingId === flag.id ? "Cancel" : "Replace value"}
                  </Button>
                </span>
              </div>
              {replacingId === flag.id ? (
                <FlagReplaceForm
                  flag={flag}
                  pending={pending}
                  onSave={(values) => void onReplace(flag.id, flag.label, values)}
                />
              ) : null}
            </li>
          ))}
        </ul>
      )}

      <Form
        label="Add flag"
        className="mt-4 rounded-md border border-border p-3"
        pending={pending || createForm.formState.isSubmitting}
        onSubmit={createForm.handleSubmit(onCreate)}
      >
        <p className="text-sm font-medium text-foreground">Add flag</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Field label="Label" htmlFor="new-flag-label" error={createForm.formState.errors.label?.message}>
            <Input id="new-flag-label" placeholder="primary" autoComplete="off" {...createForm.register("label")} />
          </Field>
          <Field label="Flag value" htmlFor="new-flag-value" error={createForm.formState.errors.flag?.message}>
            <Input id="new-flag-value" type="password" autoComplete="off" placeholder="flag{…}" {...createForm.register("flag")} />
          </Field>
        </div>
        <label htmlFor="new-flag-case" className="mt-3 flex cursor-pointer items-center gap-2 text-sm text-muted">
          <input
            id="new-flag-case"
            type="checkbox"
            className="h-4 w-4 accent-(--accent)"
            {...createForm.register("case_sensitive")}
          />
          Case-sensitive comparison
        </label>
        <div className="mt-3">
          <Button type="submit" size="sm" loading={pending || createForm.formState.isSubmitting}>
            Add flag
          </Button>
        </div>
      </Form>
    </div>
  );
}

function FlagReplaceForm({
  flag,
  pending,
  onSave,
}: {
  flag: AdminFlagRef;
  pending: boolean;
  onSave: (values: FlagReplaceInput) => void;
}) {
  const form = useForm<FlagReplaceInput>({
    resolver: zodResolver(flagReplaceSchema),
    defaultValues: { flag: "" },
  });

  return (
    <Form
      label={`Replace flag ${flag.label}`}
      className="mt-3 flex flex-wrap items-end gap-2"
      pending={form.formState.isSubmitting}
      onSubmit={form.handleSubmit(onSave)}
    >
      <Field
        label="New flag value"
        htmlFor={`replace-flag-${flag.id}`}
        error={form.formState.errors.flag?.message}
        className="min-w-52 flex-1"
      >
        <Input
          id={`replace-flag-${flag.id}`}
          type="password"
          autoComplete="off"
          placeholder="flag{…}"
          {...form.register("flag")}
        />
      </Field>
      <Button size="sm" loading={form.formState.isSubmitting || pending}>
        Save replacement
      </Button>
    </Form>
  );
}
