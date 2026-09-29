"use client";

import { useRouter } from "next/navigation";
import { useId, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { api, ApiError } from "@/lib/api/client";
import { errorMessage } from "@/lib/errors";
import type { SubmissionOutcome } from "@/lib/types";

export function FlagSubmitBox({
  challengeId,
  alreadySolved = false,
}: {
  challengeId: number;
  alreadySolved?: boolean;
}) {
  const id = useId();
  const router = useRouter();
  const [flag, setFlag] = useState("");
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<SubmissionOutcome | null>(
    alreadySolved ? { result: "correct", already_solved: true } : null,
  );
  const [error, setError] = useState<string | null>(null);

  const solved = alreadySolved || result?.result === "correct";

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!flag.trim()) {
      setError("Enter a flag to submit.");
      return;
    }
    startTransition(async () => {
      try {
        const res = await api.post<{ data: SubmissionOutcome }>(
          `/challenges/${challengeId}/submissions`,
          { flag: flag.trim() },
        );
        setResult(res.data);
        if (res.data.result === "correct") {
          setFlag("");
          router.refresh();
        }
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          router.push("/login");
          return;
        }
        setError(errorMessage(err, "Submission failed."));
      }
    });
  }

  return (
    <section
      aria-labelledby={`${id}-title`}
      className="border border-border bg-surface p-5"
      data-testid="flag-submit-box"
    >
      <h2 id={`${id}-title`} className="font-mono text-xs uppercase tracking-[0.16em] text-accent">
        Submit flag
      </h2>

      {solved ? (
        <p className="mt-3 text-sm text-success" role="status" data-testid="flag-success">
          {result?.already_solved
            ? "Already solved — nice work."
            : `Correct! +${result?.points_awarded ?? 0} points awarded.`}
        </p>
      ) : (
        <form onSubmit={onSubmit} className="mt-4 space-y-3">
          <Field label="Flag" htmlFor={`${id}-flag`} error={error ?? undefined}>
            <Input
              id={`${id}-flag`}
              name="flag"
              autoComplete="off"
              spellCheck={false}
              placeholder="flag{…}"
              value={flag}
              onChange={(e) => setFlag(e.target.value)}
              disabled={pending}
              aria-invalid={!!error}
              data-testid="flag-input"
            />
          </Field>
          <Button type="submit" disabled={pending} data-testid="flag-submit">
            {pending ? "Checking…" : "Submit"}
          </Button>
        </form>
      )}

      {result?.result === "incorrect" ? (
        <p className="mt-3 text-sm text-danger" role="status" data-testid="flag-incorrect">
          Incorrect flag. Try again.
        </p>
      ) : null}
    </section>
  );
}
