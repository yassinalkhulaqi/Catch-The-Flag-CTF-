"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Clock3, ShieldCheck, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Field, Input } from "@/components/ui/input";
import { api, ApiError } from "@/lib/api/client";
import { errorMessage } from "@/lib/errors";
import { CountUp } from "@/lib/motion/count-up";
import { flagSchema, type FlagInput as FlagValues } from "@/lib/schemas/flag";
import { prefersReducedMotion } from "@/lib/motion/reduced";
import { cn } from "@/lib/utils";
import type { SubmissionOutcome } from "@/lib/types";

export function FlagSubmitBox({
  challengeId,
  alreadySolved = false,
  pointsRemaining,
  onSolved,
}: {
  challengeId: number;
  alreadySolved?: boolean;
  pointsRemaining?: number;
  onSolved?: (outcome: SubmissionOutcome) => void;
}) {
  const id = useId();
  const router = useRouter();
  const panelRef = useRef<HTMLElement>(null);
  const form = useForm<FlagValues>({
    resolver: zodResolver(flagSchema),
    defaultValues: { flag: "" },
  });
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<SubmissionOutcome | null>(
    alreadySolved ? { result: "correct", already_solved: true } : null,
  );
  const [error, setError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [shake, setShake] = useState(false);
  const [retryIn, setRetryIn] = useState<number | null>(null);

  const solved = alreadySolved || result?.result === "correct";

  useEffect(() => {
    if (retryIn === null || retryIn <= 0) return;
    const timer = window.setTimeout(() => {
      setRetryIn((current) => (current === null ? null : current - 1));
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [retryIn]);

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    void form.handleSubmit(({ flag }) => {
    setError(null);
    if (retryIn !== null && retryIn > 0) return;
    startTransition(async () => {
      try {
        const res = await api.post<{ data: SubmissionOutcome }>(
          `/challenges/${challengeId}/submissions`,
          { flag: flag.trim() },
        );
        setResult(res.data);
        setAttempts((count) => count + 1);
        if (res.data.result === "correct") {
          form.reset({ flag: "" });
          onSolved?.(res.data);
          if (!res.data.already_solved && !prefersReducedMotion() && panelRef.current) {
            const rect = panelRef.current.getBoundingClientRect();
            const { burstConfetti } = await import("@/lib/motion/confetti");
            burstConfetti({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
          }
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
    })(event);
  }

  return (
    <section
      ref={panelRef}
      aria-labelledby={`${id}-title`}
      className={cn("rounded-xl border border-border bg-surface p-5", shake && "animate-shake")}
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
          <div className="mt-4 flex items-start gap-3 rounded-xl border border-success/30 bg-success/10 p-4">
            <CheckCircle2 aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-success" />
            <div>
              <p className="text-sm font-semibold text-success" role="status" data-testid="flag-success">
                {result?.already_solved ? (
                  "Already solved — nice work."
                ) : (
                  <>
                    Correct! +
                    <CountUp value={result?.points_awarded ?? 0} /> points awarded.
                  </>
                )}
              </p>
              <p className="mt-1 text-xs text-muted">
                The solve is recorded server-side and reflected on your dashboard.
              </p>
            </div>
          </div>
        ) : null}
      </div>

      {solved ? null : (
        <Form
          label="Submit flag"
          onSubmit={onSubmit}
          pending={pending}
          className="mt-4 space-y-3"
        >
          <Field
            label="Flag"
            htmlFor={`${id}-flag`}
            error={error ?? form.formState.errors.flag?.message}
            hint="Format varies. The comparison happens on the server."
          >
            <Input
              id={`${id}-flag`}
              autoComplete="off"
              spellCheck={false}
              placeholder="flag{…}"
              disabled={pending || (retryIn !== null && retryIn > 0)}
              aria-invalid={!!error || !!form.formState.errors.flag || result?.result === "incorrect"}
              data-testid="flag-input"
              {...form.register("flag")}
            />
          </Field>
          <Button
            type="submit"
            loading={pending}
            disabled={retryIn !== null && retryIn > 0}
            data-testid="flag-submit"
          >
            Submit
          </Button>
        </Form>
      )}

      {result?.result === "incorrect" ? (
        <p
          className="mt-3 inline-flex items-center gap-1.5 text-sm text-danger"
          role="alert"
          data-testid="flag-incorrect"
        >
          <XCircle aria-hidden="true" className="size-4" />
          Incorrect flag. Try again.
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
        <p className="font-mono text-[11px] text-faint">
          Attempts this session: {attempts}
        </p>
        {retryIn !== null && retryIn > 0 ? (
          <Badge tone="warning" className="normal-case">
            <Clock3 aria-hidden="true" className="size-3" />
            Retry in {retryIn}s
          </Badge>
        ) : (
          <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wide text-faint">
            <ShieldCheck aria-hidden="true" className="size-3 text-success" />
            Server-checked
          </span>
        )}
      </div>
    </section>
  );
}
