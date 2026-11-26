"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Form, FormError } from "@/components/ui/form";
import { api } from "@/lib/api/client";
import { errorMessage } from "@/lib/errors";
import { quizAnswersSchema, type QuizAnswersInput } from "@/lib/schemas/quiz";
import type { Quiz, QuizAttemptResult, QuizQuestion } from "@/lib/types";

export function QuizAttempt({ quiz }: { quiz: Quiz }) {
  const router = useRouter();
  const [attemptId, setAttemptId] = useState<number | null>(null);
  const [result, setResult] = useState<QuizAttemptResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const form = useForm<QuizAnswersInput>({
    resolver: zodResolver(quizAnswersSchema(quiz.questions.map((q) => q.id))),
    defaultValues: { answers: {} },
  });
  const answers = form.watch("answers");

  function toggle(question: QuizQuestion, optionId: number) {
    const key = String(question.id);
    const current = answers[key] ?? [];
    const next = question.type === "multiple"
      ? current.includes(optionId)
        ? current.filter((id) => id !== optionId)
        : [...current, optionId]
      : [optionId];
    form.setValue(`answers.${key}`, next, { shouldValidate: true });
  }

  function start() {
    setError(null);
    startTransition(async () => {
      try {
        const res = await api.post<{ data: { attempt: { id: number } } }>(
          `/quizzes/${quiz.id}/attempts`,
        );
        setAttemptId(res.data.attempt.id);
        setResult(null);
        form.reset({ answers: {} });
      } catch (err) {
        setError(errorMessage(err));
      }
    });
  }

  const onSubmit = form.handleSubmit(({ answers: selections }) => {
    if (!attemptId) return;
    setError(null);
    startTransition(async () => {
      try {
        for (const q of quiz.questions) {
          await api.post(`/quiz-attempts/${attemptId}/answer`, {
            question_id: q.id,
            selected_option_ids: selections[String(q.id)] ?? [],
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
  });

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

      <FormError>{error ?? (
        typeof form.formState.errors.answers?.message === "string"
          ? form.formState.errors.answers.message
          : undefined
      )}</FormError>

      {!attemptId ? (
        <Button onClick={start} loading={pending}>
          Start attempt
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
          <Button className="mt-4" variant="secondary" onClick={start} loading={pending}>
            Retry
          </Button>
        </div>
      ) : (
        <Form label="Quiz answers" onSubmit={onSubmit} pending={pending} className="space-y-6">
          {quiz.questions.map((q, idx) => (
            <fieldset key={q.id} className="border border-border bg-surface p-4">
              <legend className="px-1 font-mono text-xs uppercase tracking-wide text-muted">
                Question {idx + 1}
              </legend>
              <p className="mt-2 text-sm font-medium text-foreground">{q.question}</p>
              <div className="mt-3 space-y-2">
                {q.options.map((opt) => {
                  const selected = (answers[String(q.id)] ?? []).includes(opt.id);
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
          <Button type="submit" loading={pending}>
            Submit quiz
          </Button>
        </Form>
      )}
    </section>
  );
}
