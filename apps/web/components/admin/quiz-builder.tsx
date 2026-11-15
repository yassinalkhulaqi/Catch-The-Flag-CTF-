"use client";

import { useState } from "react";
import { Check, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import {
  createLessonQuiz,
  createQuizOption,
  createQuizQuestion,
  deleteAdminQuiz,
  deleteQuizOption,
  deleteQuizQuestion,
  updateAdminQuiz,
  updateQuizOption,
  updateQuizQuestion,
} from "@/lib/api/admin";
import type {
  AdminQuiz,
  AdminQuizOption,
  AdminQuizQuestion,
  AdminQuizQuestionType,
} from "@/lib/types";

const QUESTION_TYPE_LABELS: Record<AdminQuizQuestionType, string> = {
  single: "Single choice",
  multiple: "Multiple choice",
  true_false: "True / false",
};
const QUESTION_TYPES = Object.keys(QUESTION_TYPE_LABELS) as AdminQuizQuestionType[];

type QuizDraft = { title: string; description: string; pass_score: number };

/**
 * Author a quiz for one lesson: create it, edit its settings, then questions
 * and options. Every mutation is an existing admin endpoint; nothing is
 * batched, nothing is reordered server-side beyond position fields.
 */
export function QuizBuilder({
  initialQuiz,
  lessonId,
}: {
  initialQuiz: AdminQuiz | null;
  lessonId: number;
}) {
  const [quiz, setQuiz] = useState<AdminQuiz | null>(initialQuiz);

  if (quiz === null) {
    return <CreateQuizCard lessonId={lessonId} onCreate={(created) => setQuiz(created)} />;
  }

  return (
    <div className="space-y-6">
      <QuizSettingsCard
        quiz={quiz}
        onChange={setQuiz}
        onDeleted={() => setQuiz(null)}
      />
      <QuestionsCard quiz={quiz} onChange={setQuiz} />
    </div>
  );
}

function CreateQuizCard({
  lessonId,
  onCreate,
}: {
  lessonId: number;
  onCreate: (quiz: AdminQuiz) => void;
}) {
  const [draft, setDraft] = useState<QuizDraft>({
    title: "Module quiz",
    description: "",
    pass_score: 70,
  });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function create() {
    const title = draft.title.trim();
    if (title === "") {
      setError("Title is required.");
      return;
    }
    setPending(true);
    setError(null);
    const result = await createLessonQuiz(lessonId, {
      title,
      description: draft.description.trim() === "" ? null : draft.description.trim(),
      pass_score: Math.min(100, Math.max(1, draft.pass_score || 70)),
    });
    setPending(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    onCreate({ ...result.data, questions: [] });
  }

  return (
    <div className="rounded-lg border border-dashed border-border-strong p-4">
      <p className="text-sm text-muted">
        This lesson has no quiz yet. Create one to attach it as a pass/fail check.
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label htmlFor="quiz-title" className="mb-1 block text-xs text-muted">
            Title
          </Label>
          <Input
            id="quiz-title"
            value={draft.title}
            onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
            placeholder="Module quiz"
          />
        </div>
        <div>
          <Label htmlFor="quiz-pass" className="mb-1 block text-xs text-muted">
            Pass score (%)
          </Label>
          <Input
            id="quiz-pass"
            type="number"
            min={1}
            max={100}
            value={draft.pass_score}
            onChange={(event) =>
              setDraft((current) => ({ ...current, pass_score: Number(event.target.value) }))
            }
          />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="quiz-desc" className="mb-1 block text-xs text-muted">
            Description (optional)
          </Label>
          <Textarea
            id="quiz-desc"
            rows={2}
            value={draft.description}
            onChange={(event) =>
              setDraft((current) => ({ ...current, description: event.target.value }))
            }
            placeholder="What this quiz checks"
          />
        </div>
      </div>
      {error ? (
        <p role="alert" className="mt-2 text-sm text-danger">
          {error}
        </p>
      ) : null}
      <Button
        type="button"
        className="mt-3"
        size="sm"
        disabled={pending}
        onClick={() => void create()}
      >
        {pending ? "Creating…" : "Create quiz"}
      </Button>
    </div>
  );
}

function QuizSettingsCard({
  quiz,
  onChange,
  onDeleted,
}: {
  quiz: AdminQuiz;
  onChange: (quiz: AdminQuiz) => void;
  onDeleted: () => void;
}) {
  const [draft, setDraft] = useState<QuizDraft>({
    title: quiz.title,
    description: quiz.description ?? "",
    pass_score: quiz.pass_score,
  });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function save() {
    const title = draft.title.trim();
    if (title === "") {
      setError("Title is required.");
      return;
    }
    setPending(true);
    setError(null);
    const result = await updateAdminQuiz(quiz.id, {
      title,
      description: draft.description.trim() === "" ? null : draft.description.trim(),
      pass_score: Math.min(100, Math.max(1, draft.pass_score || 70)),
    });
    setPending(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    onChange({ ...quiz, ...result.data });
  }

  async function remove() {
    setPending(true);
    setError(null);
    const result = await deleteAdminQuiz(quiz.id);
    setPending(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    onDeleted();
  }

  return (
    <section aria-labelledby="quiz-settings-heading" className="rounded-lg border border-border p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 id="quiz-settings-heading" className="type-eyebrow text-accent">
          Quiz settings
        </h3>
        {confirmDelete ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted">Delete the quiz and all its questions?</span>
            <Button type="button" variant="danger" size="sm" disabled={pending} onClick={() => void remove()}>
              Confirm delete
            </Button>
            <Button type="button" variant="ghost" size="sm" disabled={pending} onClick={() => setConfirmDelete(false)}>
              Keep
            </Button>
          </div>
        ) : (
          <Button type="button" variant="ghost" size="sm" onClick={() => setConfirmDelete(true)}>
            <Trash2 aria-hidden="true" className="size-4" />
            Delete quiz
          </Button>
        )}
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label htmlFor="quiz-s-title" className="mb-1 block text-xs text-muted">
            Title
          </Label>
          <Input
            id="quiz-s-title"
            value={draft.title}
            onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
          />
        </div>
        <div>
          <Label htmlFor="quiz-s-pass" className="mb-1 block text-xs text-muted">
            Pass score (%)
          </Label>
          <Input
            id="quiz-s-pass"
            type="number"
            min={1}
            max={100}
            value={draft.pass_score}
            onChange={(event) =>
              setDraft((current) => ({ ...current, pass_score: Number(event.target.value) }))
            }
          />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="quiz-s-desc" className="mb-1 block text-xs text-muted">
            Description (optional)
          </Label>
          <Textarea
            id="quiz-s-desc"
            rows={2}
            value={draft.description}
            onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))}
          />
        </div>
      </div>
      {error ? (
        <p role="alert" className="mt-2 text-sm text-danger">
          {error}
        </p>
      ) : null}
      <Button type="button" variant="secondary" size="sm" className="mt-3" disabled={pending} onClick={() => void save()}>
        {pending ? "Saving…" : "Save settings"}
      </Button>
    </section>
  );
}

function QuestionsCard({
  quiz,
  onChange,
}: {
  quiz: AdminQuiz;
  onChange: (quiz: AdminQuiz) => void;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newQuestion, setNewQuestion] = useState("");

  async function addQuestion() {
    const text = newQuestion.trim();
    if (text === "") {
      setError("Write the question first.");
      return;
    }
    setPending(true);
    setError(null);
    const result = await createQuizQuestion(quiz.id, {
      question: text,
      type: "single",
      points: 1,
      position: (quiz.questions ?? []).length + 1,
    });
    setPending(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    onChange({ ...quiz, questions: [...(quiz.questions ?? []), result.data] });
    setNewQuestion("");
  }

  return (
    <section aria-labelledby="quiz-questions-heading" className="rounded-lg border border-border p-4">
      <h3 id="quiz-questions-heading" className="type-eyebrow text-accent">
        Questions · {quiz.questions?.length ?? 0}
      </h3>
      {error ? (
        <p role="alert" className="mt-2 text-sm text-danger">
          {error}
        </p>
      ) : null}
      <ol className="mt-3 space-y-4">
        {(quiz.questions ?? []).map((question, index) => (
          <QuestionEditor
            key={question.id}
            quiz={quiz}
            question={question}
            index={index}
            onChange={onChange}
          />
        ))}
      </ol>
      <form
        className="mt-4 flex flex-wrap items-end gap-2 border-t border-border pt-4"
        onSubmit={(event) => {
          event.preventDefault();
          void addQuestion();
        }}
      >
        <div className="min-w-0 flex-1">
          <Label htmlFor="new-question" className="mb-1 block text-xs text-muted">
            Add a question
          </Label>
          <Input
            id="new-question"
            value={newQuestion}
            onChange={(event) => setNewQuestion(event.target.value)}
            placeholder="What does the learner need to demonstrate?"
          />
        </div>
        <Button type="submit" variant="secondary" size="sm" disabled={pending}>
          <Plus aria-hidden="true" className="size-4" />
          {pending ? "Adding…" : "Add question"}
        </Button>
      </form>
    </section>
  );
}

function QuestionEditor({
  quiz,
  question,
  index,
  onChange,
}: {
  quiz: AdminQuiz;
  question: AdminQuizQuestion;
  index: number;
  onChange: (quiz: AdminQuiz) => void;
}) {
  const [draft, setDraft] = useState({
    question: question.question,
    type: question.type,
    explanation: question.explanation ?? "",
    points: question.points,
  });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function replaceQuestion(patch: Partial<AdminQuizQuestion>) {
    onChange({
      ...quiz,
      questions: (quiz.questions ?? []).map((candidate) =>
        candidate.id === question.id ? { ...candidate, ...patch } : candidate,
      ),
    });
  }

  function replaceOption(optionId: number, patch: Partial<AdminQuizOption>) {
    const patchQuestion = (candidate: AdminQuizQuestion): AdminQuizQuestion => ({
      ...candidate,
      options: (candidate.options ?? []).map((option) =>
        option.id === optionId ? { ...option, ...patch } : option,
      ),
    });
    onChange({
      ...quiz,
      questions: (quiz.questions ?? []).map((candidate) =>
        candidate.id === question.id ? patchQuestion(candidate) : candidate,
      ),
    });
  }

  function removeQuestion() {
    onChange({
      ...quiz,
      questions: (quiz.questions ?? []).filter((candidate) => candidate.id !== question.id),
    });
  }

  async function save() {
    setPending(true);
    setError(null);
    const result = await updateQuizQuestion(quiz.id, question.id, {
      question: draft.question.trim(),
      type: draft.type,
      explanation: draft.explanation.trim() === "" ? null : draft.explanation.trim(),
      points: Math.max(1, draft.points || 1),
    });
    setPending(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    replaceQuestion(result.data);
  }

  async function remove() {
    setPending(true);
    setError(null);
    const result = await deleteQuizQuestion(quiz.id, question.id);
    setPending(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    removeQuestion();
  }

  async function addOption() {
    setPending(true);
    setError(null);
    const result = await createQuizOption(question.id, {
      option_text: "New option",
      is_correct: false,
      position: (question.options ?? []).length + 1,
    });
    setPending(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    replaceQuestion({ options: [...(question.options ?? []), result.data] });
  }

  async function saveOption(option: AdminQuizOption, patch: Partial<{ option_text: string; is_correct: boolean }>) {
    setPending(true);
    setError(null);
    const result = await updateQuizOption(question.id, option.id, patch);
    setPending(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    replaceOption(option.id, result.data);
  }

  async function removeOption(option: AdminQuizOption) {
    setPending(true);
    setError(null);
    const result = await deleteQuizOption(question.id, option.id);
    setPending(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    replaceQuestion({
      options: (question.options ?? []).filter((candidate) => candidate.id !== option.id),
    });
  }

  async function markCorrect(option: AdminQuizOption) {
    if (draft.type === "multiple") {
      await saveOption(option, { is_correct: !option.is_correct });
      return;
    }
    setPending(true);
    setError(null);
    // Single / true-false: exactly one correct option.
    for (const candidate of question.options ?? []) {
      if (candidate.is_correct && candidate.id !== option.id) {
        const result = await updateQuizOption(question.id, candidate.id, { is_correct: false });
        if (result.ok) replaceOption(candidate.id, { is_correct: false });
      }
    }
    await saveOption(option, { is_correct: true });
    setPending(false);
  }

  const isSingle = draft.type !== "multiple";

  return (
    <li className="rounded-lg border border-border bg-surface p-4">
      <div className="flex flex-wrap items-center gap-3">
        <span className="font-mono text-xs text-faint">Q{index + 1}</span>
        <select
          value={draft.type}
          onChange={(event) => setDraft((current) => ({ ...current, type: event.target.value as AdminQuizQuestionType }))}
          className="h-9 rounded-md border border-border bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
          aria-label="Question type"
        >
          {QUESTION_TYPES.map((type) => (
            <option key={type} value={type}>
              {QUESTION_TYPE_LABELS[type]}
            </option>
          ))}
        </select>
        <div className="flex items-center gap-1 text-sm text-muted">
          <Label htmlFor={`q-points-${question.id}`} className="text-xs text-muted">
            Points
          </Label>
          <Input
            id={`q-points-${question.id}`}
            type="number"
            min={1}
            max={1000}
            className="h-8 w-16"
            value={draft.points}
            onChange={(event) => setDraft((current) => ({ ...current, points: Number(event.target.value) }))}
          />
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => void remove()}
          disabled={pending}
          aria-label="Delete question"
        >
          <Trash2 aria-hidden="true" className="size-4" />
        </Button>
      </div>

      <Textarea
        aria-label="Question text"
        className="mt-3"
        rows={2}
        value={draft.question}
        onChange={(event) => setDraft((current) => ({ ...current, question: event.target.value }))}
      />
      <Textarea
        aria-label="Explanation (shown after answering)"
        className="mt-2"
        rows={1}
        placeholder="Explanation shown after answering (optional)"
        value={draft.explanation}
        onChange={(event) => setDraft((current) => ({ ...current, explanation: event.target.value }))}
      />
      {error ? (
        <p role="alert" className="mt-2 text-sm text-danger">
          {error}
        </p>
      ) : null}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button type="button" variant="secondary" size="sm" onClick={() => void save()} disabled={pending}>
          <Check aria-hidden="true" className="size-4" />
          Save question
        </Button>
        <span className="text-xs text-muted">
          Options: mark {isSingle ? "exactly one" : "every correct"} option as correct
        </span>
      </div>

      <ul className="mt-3 space-y-2">
        {(question.options ?? []).map((option) => (
          <li key={option.id} className="flex items-center gap-2">
            {isSingle ? (
              <input
                type="radio"
                name={`correct-${question.id}`}
                aria-label="Mark as correct answer"
                checked={option.is_correct}
                onChange={() => void markCorrect(option)}
                disabled={pending}
                className="size-4"
              />
            ) : (
              <input
                type="checkbox"
                aria-label="Mark as correct answer"
                checked={option.is_correct}
                onChange={() => void markCorrect(option)}
                disabled={pending}
                className="size-4"
              />
            )}
            <Input
              aria-label="Option text"
              className="h-8 flex-1"
              defaultValue={option.option_text}
              onBlur={(event) => {
                const text = event.target.value.trim();
                if (text !== option.option_text.trim() && text !== "") {
                  void saveOption(option, { option_text: text });
                }
              }}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => void removeOption(option)}
              disabled={pending}
              aria-label="Remove option"
            >
              <X aria-hidden="true" className="size-4" />
            </Button>
          </li>
        ))}
      </ul>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="mt-2"
        onClick={() => void addOption()}
        disabled={pending}
      >
        <Plus aria-hidden="true" className="size-4" />
        Add option
      </Button>
    </li>
  );
}
