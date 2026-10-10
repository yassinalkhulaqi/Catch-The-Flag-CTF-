"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { api, ApiError } from "@/lib/api/client";
import { errorMessage } from "@/lib/errors";
import { CountUp } from "@/lib/motion/count-up";
import { prefersReducedMotion } from "@/lib/motion/reduced";
import { playSolve } from "@/lib/motion/solve";
import { cn } from "@/lib/utils";
import type { SubmissionOutcome } from "@/lib/types";

export function FlagSubmitBox({
  challengeId,
  alreadySolved = false,
  pointsRemaining,
}: {
  challengeId: number;
  alreadySolved?: boolean;
  pointsRemaining?: number;
}) {
  const id = useId();
  const router = useRouter();
  const panelRef = useRef<HTMLElement>(null);
  const cancelCelebrate = useRef<(() => void) | null>(null);
  const [flag, setFlag] = useState("");
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<SubmissionOutcome | null>(
    alreadySolved ? { result: "correct", already_solved: true } : null,
  );
  const [error, setError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [shake, setShake] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  const [retryIn, setRetryIn] = useState<number | null>(null);

  const solved = alreadySolved || result?.result === "correct";

  useEffect(() => {
    return () => cancelCelebrate.current?.();
  }, []);

  useEffect(() => {
    if (retryIn === null || retryIn <= 0) return;
    const timer = window.setTimeout(() => {
      setRetryIn((current) => (current === null ? null : current - 1));
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [retryIn]);

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (retryIn !== null && retryIn > 0) return;
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
        setAttempts((count) => count + 1);
        if (res.data.result === "correct") {
          setFlag("");
          const rect = panelRef.current?.getBoundingClientRect();
          const plan = await playSolve({
            origin: rect ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 } : null,
            points: res.data.points_awarded ?? 0,
            alreadySolved: res.data.already_solved,
            reduced: prefersReducedMotion(),
          });
          cancelCelebrate.current?.();
          cancelCelebrate.current = plan.cancel;
          setCelebrate(plan.celebrate);
          router.refresh();
        } else {
          setShake(true);
          window.setTimeout(() => setShake(false), 450);
        }
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          router.push("/login");
          return;
        }
        if (err instanceof ApiError && err.status === 429) {
          setRetryIn(err.retryAfterSeconds ?? 60);
          setError("Too many submissions. Wait for the timer, then try again.");
          return;
        }
        setError(errorMessage(err, "Submission failed."));
      }
    });
  }

  return (
    <section
      ref={panelRef}
      aria-labelledby={`${id}-title`}
      className={cn(
        "rounded-xl border border-border bg-surface p-5",
        shake && "animate-shake",
        celebrate && "solve-celebrate",
      )}
      data-testid="flag-submit-box"
    >
      <h2 id={`${id}-title`} className="type-eyebrow text-accent">
        Submit flag
      </h2>
      {pointsRemaining !== undefined ? (
        <p className="mt-2 font-mono text-xs text-muted">Worth up to {pointsRemaining} points after hints.</p>
      ) : null}

      <div aria-live="polite">
        {solved ? (
          <p className="mt-3 text-sm text-success" role="status" data-testid="flag-success">
            {result?.already_solved ? (
              "Already solved — nice work."
            ) : (
              <>
                Correct! +
                <CountUp value={result?.points_awarded ?? 0} /> points awarded.
              </>
            )}
          </p>
        ) : null}
      </div>

      {solved ? null : (
        <form onSubmit={onSubmit} className="mt-4 space-y-3" aria-busy={pending}>
          <Field
            label="Flag"
            htmlFor={`${id}-flag`}
            error={error ?? undefined}
            hint="Format varies. The comparison happens on the server."
          >
            <Input
              id={`${id}-flag`}
              name="flag"
              autoComplete="off"
              spellCheck={false}
              placeholder="flag{…}"
              value={flag}
              onChange={(event) => setFlag(event.target.value)}
              disabled={pending || (retryIn !== null && retryIn > 0)}
              aria-invalid={!!error || result?.result === "incorrect"}
              data-testid="flag-input"
            />
          </Field>
          <Button type="submit" disabled={pending || (retryIn !== null && retryIn > 0)} data-testid="flag-submit">
            {pending ? "Checking…" : "Submit"}
          </Button>
        </form>
      )}

      {result?.result === "incorrect" ? (
        <p className="mt-3 text-sm text-danger" role="alert" data-testid="flag-incorrect">
          Incorrect flag. Try again.
        </p>
      ) : null}

      <p className="mt-3 font-mono text-[11px] text-faint">
        Attempts this session: {attempts}
        {retryIn !== null && retryIn > 0 ? ` · retry in ${retryIn}s` : ""}
      </p>
    </section>
  );
}
