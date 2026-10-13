"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import {
  createAdminChallengeFlag,
  updateAdminChallengeFlag,
  type AdminFlagRef,
} from "@/lib/api/admin";

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
  const [label, setLabel] = useState("");
  const [value, setValue] = useState("");
  const [caseSensitive, setCaseSensitive] = useState(true);
  const [replaceValue, setReplaceValue] = useState("");

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    if (pending) return;
    if (!label.trim() || !value) {
      setError("Label and flag value are both required.");
      return;
    }
    setPending(true);
    setError(null);
    const result = await createAdminChallengeFlag(challengeId, {
      label: label.trim(),
      flag: value,
      case_sensitive: caseSensitive,
    });
    setPending(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setFlags((prev) => [...prev, result.data]);
    setLabel("");
    setValue("");
    router.refresh();
  }

  async function onReplace(flagId: number, currentLabel: string) {
    if (pending) return;
    if (!replaceValue) {
      setError("Enter the replacement flag value first.");
      return;
    }
    setPending(true);
    setError(null);
    const result = await updateAdminChallengeFlag(challengeId, flagId, {
      label: currentLabel,
      flag: replaceValue,
      case_sensitive: true,
    });
    setPending(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setFlags((prev) => prev.map((f) => (f.id === flagId ? result.data : f)));
    setReplacingId(null);
    setReplaceValue("");
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
      {error ? (
        <p role="alert" className="mb-3 text-sm text-danger">
          {error}
        </p>
      ) : null}

      {flags.length === 0 ? (
        <p className="text-sm text-muted">
          No flags configured yet. A challenge needs at least one flag before
          it can be solved.
        </p>
      ) : (
        <ul className="space-y-2">
          {flags.map((flag) => (
            <li
              key={flag.id}
              className="rounded-md border border-border bg-surface-raised px-3 py-2"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-mono text-xs text-foreground">
                  {flag.label}
                </span>
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
                      setReplaceValue("");
                      setError(null);
                    }}
                    aria-expanded={replacingId === flag.id}
                  >
                    {replacingId === flag.id ? "Cancel" : "Replace value"}
                  </Button>
                </span>
              </div>
              {replacingId === flag.id ? (
                <form
                  className="mt-3 flex flex-wrap items-end gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    onReplace(flag.id, flag.label);
                  }}
                  aria-label={`Replace flag ${flag.label}`}
                >
                  <Field
                    label="New flag value"
                    htmlFor={`replace-flag-${flag.id}`}
                    className="min-w-52 flex-1"
                  >
                    <Input
                      id={`replace-flag-${flag.id}`}
                      type="password"
                      autoComplete="off"
                      value={replaceValue}
                      onChange={(e) => setReplaceValue(e.target.value)}
                      placeholder="flag{…}"
                    />
                  </Field>
                  <Button size="sm" disabled={pending}>
                    {pending ? "Saving…" : "Save replacement"}
                  </Button>
                </form>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      <form
        onSubmit={onCreate}
        className="mt-4 rounded-md border border-border p-3"
        aria-label="Add flag"
      >
        <p className="text-sm font-medium text-foreground">Add flag</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Field label="Label" htmlFor="new-flag-label">
            <Input
              id="new-flag-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="primary"
              autoComplete="off"
            />
          </Field>
          <Field label="Flag value" htmlFor="new-flag-value">
            <Input
              id="new-flag-value"
              type="password"
              autoComplete="off"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="flag{…}"
            />
          </Field>
        </div>
        <label
          htmlFor="new-flag-case"
          className="mt-3 flex cursor-pointer items-center gap-2 text-sm text-muted"
        >
          <input
            id="new-flag-case"
            type="checkbox"
            checked={caseSensitive}
            onChange={(e) => setCaseSensitive(e.target.checked)}
            className="h-4 w-4 accent-(--accent)"
          />
          Case-sensitive comparison
        </label>
        <div className="mt-3">
          <Button type="submit" size="sm" disabled={pending}>
            {pending ? "Adding…" : "Add flag"}
          </Button>
        </div>
      </form>
    </div>
  );
}
