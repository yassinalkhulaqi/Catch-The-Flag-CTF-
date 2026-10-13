"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { ApiError, api } from "@/lib/api/client";
import type { SubmissionOutcome } from "@/lib/types";

interface Feedback {
  tone: "success" | "info" | "error";
  message: string;
}

const toneClass: Record<Feedback["tone"], string> = {
  success: "text-success",
  info: "text-muted",
  error: "text-danger",
};

/**
 * Flag submission island for the challenge detail page.
 * POSTs through the same-origin BFF; the backend owns grading, points, XP
 * and solve state. Incorrect feedback is intentionally uniform — it never
 * hints at the expected format.
 */
export function FlagSubmitBox({
  challengeId,
  solved,
}: {
  challengeId: number;
  solved: boolean;
}) {
  const router = useRouter();
  const [flag, setFlag] = useState("");
  const [pending, setPending] = useState(false);
  const [justSolved, setJustSolved] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(
    solved
      ? {
          tone: "info",
          message: "You have already solved this challenge.",
        }
      : null,
  );

  const disabled = solved || justSolved;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (disabled || pending) return;
    const value = flag.trim();
    if (!value) return;
    setPending(true);
    setFeedback(null);
    try {
      const res = await api.post<{ data: SubmissionOutcome }>(
        `/challenges/${challengeId}/submissions`,
        { flag: value },
      );
      const outcome = res.data;
      if (outcome.result === "correct") {
        if (outcome.already_solved) {
          setFeedback({
            tone: "info",
            message:
              "Already solved — this flag was accepted before. No additional points awarded.",
          });
        } else {
          const points = outcome.points_awarded ?? 0;
          const xp =
            outcome.xp_total !== undefined
              ? ` · ${outcome.xp_total} XP total`
              : "";
          setFeedback({
            tone: "success",
            message: `Correct! +${points} pts${xp}.`,
          });
        }
        setJustSolved(true);
        router.refresh();
      } else {
        setFeedback({ tone: "error", message: "Incorrect flag. Try again." });
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 429) {
        setFeedback({
          tone: "error",
          message:
            "Too many attempts — rate limited. Wait a moment, then try again.",
        });
      } else if (err instanceof ApiError && err.status === 401) {
        setFeedback({ tone: "error", message: "Log in to submit flags." });
      } else {
        setFeedback({
          tone: "error",
          message:
            err instanceof ApiError
              ? err.message
              : "Submission failed. Try again.",
        });
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <Card>
      <form onSubmit={onSubmit} aria-label="Submit flag" className="space-y-3">
        <Field label="Flag" htmlFor="flag-input">
          <Input
            id="flag-input"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            required
            disabled={disabled || pending}
            value={flag}
            onChange={(e) => setFlag(e.target.value)}
            placeholder="Enter the flag"
          />
        </Field>
        <Button
          type="submit"
          disabled={disabled || pending || flag.trim() === ""}
        >
          {pending ? "Checking…" : disabled ? "Solved" : "Submit flag"}
        </Button>
        {feedback ? (
          <p
            role="alert"
            aria-live="polite"
            className={`text-sm ${toneClass[feedback.tone]}`}
          >
            {feedback.message}
          </p>
        ) : null}
      </form>
    </Card>
  );
}
