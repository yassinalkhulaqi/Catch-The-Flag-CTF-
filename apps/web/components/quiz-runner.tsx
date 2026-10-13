"use client";

import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import {
  getQuizAttempt,
  saveAttemptAnswer,
  startQuizAttempt,
  submitQuizAttempt,
  type QuizAttemptDetail,
} from "@/lib/api/quiz-client";
import type { Quiz, QuizAttemptResult, QuizQuestion } from "@/lib/types";

type Phase = "idle" | "running" | "submitting" | "done";

const GENERIC_ERROR =
  "Something went wrong. The backend may be unavailable — try again.";

/**
 * Quiz attempt island: start → one question at a time (answer POSTed per
 * question) → submit → score summary with explanations. Server owns grading;
 * this component only sequences requests and renders state. Never throws —
 * all failures surface as inline messages with role="alert".
 */
export function QuizRunner({ quiz }: { quiz: Quiz }) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [attemptId, setAttemptId] = useState<number | null>(null);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number[]>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<QuizAttemptResult | null>(null);
  const [detail, setDetail] = useState<QuizAttemptDetail | null>(null);

  const questions = quiz.questions;
  const total = questions.length;
  const current: QuizQuestion | undefined = questions[index];
  const isLast = index === total - 1;

  async function start() {
    setError(null);
    const attempt = await startQuizAttempt(quiz.id);
    if (!attempt) {
      setError(GENERIC_ERROR);
      return;
    }
    setAttemptId(attempt.id);
    setIndex(0);
    setAnswers({});
    setResult(null);
    setDetail(null);
    setPhase("running");
  }

  function toggleOption(question: QuizQuestion, optionId: number) {
    setAnswers((prev) => {
      const selected = prev[question.id] ?? [];
      if (question.type === "multiple") {
        return {
          ...prev,
          [question.id]: selected.includes(optionId)
            ? selected.filter((id) => id !== optionId)
            : [...selected, optionId],
        };
      }
      return { ...prev, [question.id]: [optionId] };
    });
  }

  async function persist(question: QuizQuestion): Promise<boolean> {
    if (attemptId === null) return false;
    setSaving(true);
    setError(null);
    const saved = await saveAttemptAnswer(attemptId, {
      question_id: question.id,
      selected_option_ids: answers[question.id] ?? [],
    });
    setSaving(false);
    if (!saved) {
      setError("Could not save this answer. Check your connection and retry.");
      return false;
    }
    return true;
  }

  async function next() {
    if (!current) return;
    if (await persist(current)) setIndex((i) => Math.min(i + 1, total - 1));
  }

  function back() {
    setError(null);
    setIndex((i) => Math.max(i - 1, 0));
  }

  async function submit() {
    if (!current || attemptId === null) return;
    const ok = await persist(current);
    if (!ok) return;
    setPhase("submitting");
    setError(null);
    const outcome = await submitQuizAttempt(attemptId);
    if (!outcome) {
      setPhase("running");
      setError(GENERIC_ERROR);
      return;
    }
    setResult(outcome);
    // Explanations are best-effort: the score summary renders regardless.
    const full = await getQuizAttempt(attemptId);
    if (full) setDetail(full);
    setPhase("done");
  }

  if (total === 0) {
    return (
      <Card>
        <CardTitle>No questions yet</CardTitle>
        <CardDescription className="mt-2">
          This quiz has no published questions. Check back later.
        </CardDescription>
      </Card>
    );
  }

  if (phase === "idle") {
    return (
      <Card>
        <CardTitle>Ready to start?</CardTitle>
        <CardDescription className="mt-2">
          {total} {total === 1 ? "question" : "questions"} · pass score{" "}
          {quiz.pass_score}. Your answers are saved as you go; submit at the
          end to see your score.
        </CardDescription>
        <div className="mt-4">
          <Button onClick={start}>Start attempt</Button>
        </div>
        {error ? (
          <p role="alert" className="mt-3 text-sm text-danger">
            {error}
          </p>
        ) : null}
      </Card>
    );
  }

  if (phase === "done" && result) {
    const review = detail?.questions ?? [];
    return (
      <div className="space-y-4">
        <Card aria-live="polite">
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle>Score: {result.score}</CardTitle>
            {result.passed ? (
              <Badge tone="success">Passed</Badge>
            ) : (
              <Badge tone="danger">Not passed</Badge>
            )}
          </div>
          <CardDescription className="mt-2">
            {result.correct_count} of {result.total} correct · pass score{" "}
            {quiz.pass_score}.
          </CardDescription>
          {result.passed ? (
            <p className="mt-3 text-sm text-success" role="status">
              You passed this quiz — nice work.
            </p>
          ) : (
            <div className="mt-4">
              <Button variant="outline" size="sm" onClick={start}>
                Retry quiz
              </Button>
            </div>
          )}
          {error ? (
            <p role="alert" className="mt-3 text-sm text-danger">
              {error}
            </p>
          ) : null}
        </Card>

        {review.length > 0 ? (
          <section aria-labelledby="explanations">
            <h2 id="explanations" className="text-lg font-semibold text-foreground">
              Review
            </h2>
            <ol className="mt-3 space-y-3">
              {review.map((q, i) => (
                <li key={q.id}>
                  <Card>
                    <p className="font-mono text-xs text-faint">
                      Question {i + 1}
                      {q.answered
                        ? q.answered.is_correct
                          ? " · correct"
                          : " · incorrect"
                        : null}
                    </p>
                    <p className="mt-1 text-sm font-medium text-foreground">
                      {q.question}
                    </p>
                    {q.explanation ? (
                      <p className="mt-2 text-sm text-muted">{q.explanation}</p>
                    ) : null}
                  </Card>
                </li>
              ))}
            </ol>
          </section>
        ) : null}

        <p className="text-sm">
          <Link
            href={`/quizzes/${quiz.id}`}
            className="text-accent hover:underline"
          >
            Back to quiz
          </Link>
        </p>
      </div>
    );
  }

  if (!current) return null;

  const selected = answers[current.id] ?? [];
  const inputType = current.type === "multiple" ? "checkbox" : "radio";

  return (
    <div className="space-y-4">
      <p className="font-mono text-xs text-faint" aria-live="polite">
        Question {index + 1} of {total}
      </p>
      <div
        role="progressbar"
        aria-valuenow={index + 1}
        aria-valuemin={1}
        aria-valuemax={total}
        aria-label="Quiz progress"
        className="h-2 overflow-hidden rounded-full bg-surface-raised"
      >
        <div
          className="h-full rounded-full bg-accent"
          style={{ width: `${((index + 1) / total) * 100}%` }}
        />
      </div>

      <Card>
        <fieldset>
          <legend className="text-sm font-semibold text-foreground">
            {current.question}
          </legend>
          <p className="mt-1 font-mono text-xs text-faint">
            {current.type === "multiple"
              ? "Select all that apply"
              : current.type === "true_false"
                ? "True or false"
                : "Select one answer"}{" "}
            · {current.points} {current.points === 1 ? "pt" : "pts"}
          </p>
          <div className="mt-3 space-y-2">
            {current.options.map((option) => {
              const inputId = `q${current.id}-o${option.id}`;
              const checked = selected.includes(option.id);
              return (
                <div
                  key={option.id}
                  className="flex items-center gap-3 rounded-md border border-border px-3 py-2 has-checked:border-accent"
                >
                  <input
                    id={inputId}
                    type={inputType}
                    name={`question-${current.id}`}
                    checked={checked}
                    disabled={saving || phase === "submitting"}
                    onChange={() => toggleOption(current, option.id)}
                    className="h-4 w-4 accent-[#f2b544]"
                  />
                  <label
                    htmlFor={inputId}
                    className="flex-1 cursor-pointer text-sm text-foreground"
                  >
                    {option.option_text}
                  </label>
                </div>
              );
            })}
          </div>
        </fieldset>

        <div className="mt-4 flex flex-wrap gap-2">
          {index > 0 ? (
            <Button
              variant="outline"
              size="sm"
              onClick={back}
              disabled={saving || phase === "submitting"}
            >
              Back
            </Button>
          ) : null}
          {!isLast ? (
            <Button size="sm" onClick={next} disabled={saving}>
              {saving ? "Saving…" : "Next"}
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={submit}
              disabled={saving || phase === "submitting"}
            >
              {phase === "submitting" || saving ? "Submitting…" : "Submit quiz"}
            </Button>
          )}
        </div>

        {error ? (
          <p role="alert" className="mt-3 text-sm text-danger">
            {error}
          </p>
        ) : null}
      </Card>
    </div>
  );
}
