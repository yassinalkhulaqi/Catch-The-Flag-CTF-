"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api/client";
import { errorMessage } from "@/lib/errors";
import type { Quiz, QuizAttemptResult, QuizQuestion } from "@/lib/types";

export function QuizAttempt({ quiz }: { quiz: Quiz }) {
  const router = useRouter();
  const [attemptId, setAttemptId] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Record<number, number[]>>({});
  const [result, setResult] = useState<QuizAttemptResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function toggle(question: QuizQuestion, optionId: number) {
    setAnswers((prev) => {
      const current = prev[question.id] ?? [];
      if (question.type === "multiple") {
        return {
          ...prev,
          [question.id]: current.includes(optionId)
            ? current.filter((id) => id !== optionId)
            : [...current, optionId],
        };
      }
      return { ...prev, [question.id]: [optionId] };
    });
  }

  function start() {
    setError(null);
    startTransition(async () => {
      try {
        const res = await api.post<{ data: { id: number } }>(
          `/quizzes/${quiz.id}/attempts`,
        );
        setAttemptId(res.data.id);
        setResult(null);
        setAnswers({});
      } catch (err) {
        setError(errorMessage(err));
      }
    });
  }

  function submit() {
    if (!attemptId) return;
    setError(null);
    startTransition(async () => {
      try {
        for (const q of quiz.questions) {
          await api.post(`/quiz-attempts/${attemptId}/answer`, {
            question_id: q.id,
            selected_option_ids: answers[q.id] ?? [],
          });
        }
        const res = await api.post<{ data: QuizAttemptResult }>(
          `/quiz-attempts/${attemptId}/submit`,
        );
        setResult(res.data);
        router.refresh();
      } catch (err) {
        setError(errorMessage(err));
      }
    });
  }

  return (
    <section className="space-y-6" aria-labelledby="quiz-title">
      <div>
        <h1 id="quiz-title" className="font-display text-3xl font-semibold">
          {quiz.title}
        </h1>
        {quiz.description ? (
          <p className="mt-2 text-sm text-muted">{quiz.description}</p>
        ) : null}
        <p className="mt-1 font-mono text-xs text-faint">
          Pass score: {quiz.pass_score}%
        </p>
      </div>

      {error ? (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}

      {!attemptId ? (
        <Button onClick={start} disabled={pending}>
          {pending ? "Starting…" : "Start attempt"}
        </Button>
      ) : result ? (
        <div
          className="border border-border bg-surface p-5"
          role="status"
          data-testid="quiz-result"
        >
          <p className="font-mono text-xs uppercase tracking-wide text-accent">Result</p>
          <p className="mt-2 text-lg font-semibold">
            {result.passed ? "Passed" : "Not passed"} — {result.score}%
          </p>
          <p className="text-sm text-muted">
            {result.correct_count} / {result.total} correct
          </p>
          <Button className="mt-4" variant="secondary" onClick={start} disabled={pending}>
            Retry
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {quiz.questions.map((q, idx) => (
            <fieldset key={q.id} className="border border-border bg-surface p-4">
              <legend className="px-1 font-mono text-xs uppercase tracking-wide text-muted">
                Question {idx + 1}
              </legend>
              <p className="mt-2 text-sm font-medium text-foreground">{q.question}</p>
              <div className="mt-3 space-y-2">
                {q.options.map((opt) => {
                  const selected = (answers[q.id] ?? []).includes(opt.id);
                  const inputType = q.type === "multiple" ? "checkbox" : "radio";
                  return (
                    <label
                      key={opt.id}
                      className="flex cursor-pointer items-start gap-2 text-sm text-muted hover:text-foreground"
                    >
                      <input
                        type={inputType}
                        name={`q-${q.id}`}
                        checked={selected}
                        onChange={() => toggle(q, opt.id)}
                        className="mt-1"
                      />
                      <span>{opt.option_text}</span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
          ))}
          <Button onClick={submit} disabled={pending}>
            {pending ? "Submitting…" : "Submit quiz"}
          </Button>
        </div>
      )}
    </section>
  );
}
