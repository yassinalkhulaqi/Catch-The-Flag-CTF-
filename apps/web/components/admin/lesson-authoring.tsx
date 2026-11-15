"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ChevronRight, Plus, Trash2 } from "lucide-react";
import { MarkdownContent } from "@/lib/markdown";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { LinkedChallenges } from "@/components/admin/linked-challenges";
import { QuizBuilder } from "@/components/admin/quiz-builder";
import {
  createAdminLesson,
  deleteAdminLesson,
  getAdminLesson,
  updateAdminLesson,
} from "@/lib/api/admin";
import type { AdminLesson } from "@/lib/types";

/** Lessons inside one module: list, edit, create, delete. */
export function ModuleLessons({
  moduleId,
  initialLessons,
}: {
  moduleId: number;
  initialLessons: AdminLesson[];
}) {
  const [lessons, setLessons] = useState(initialLessons);
  const [openId, setOpenId] = useState<number | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function addLesson() {
    const title = newTitle.trim();
    if (title === "") {
      setError("Title is required.");
      return;
    }
    setPending(true);
    setError(null);
    const result = await createAdminLesson(moduleId, {
      title,
      content: `# ${title}\n\nWrite the lesson here.`,
      position: lessons.length + 1,
      estimated_minutes: 15,
      is_published: false,
    });
    setPending(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setLessons((current) => [...current, result.data]);
    setOpenId(result.data.id);
    setNewTitle("");
  }

  function replaceLesson(updated: AdminLesson) {
    setLessons((current) =>
      current.map((lesson) => (lesson.id === updated.id ? { ...lesson, ...updated } : lesson)),
    );
  }

  function removeLesson(id: number) {
    setLessons((current) => current.filter((lesson) => lesson.id !== id));
    setOpenId((current) => (current === id ? null : current));
  }

  return (
    <section aria-labelledby="lessons-heading" className="space-y-3">
      <h2 id="lessons-heading" className="type-eyebrow text-accent">
        Lessons · {lessons.length}
      </h2>
      {error ? (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}

      <ol className="space-y-2">
        {lessons.map((lesson) => (
          <li key={lesson.id} className="rounded-lg border border-border bg-surface">
            <div className="flex flex-wrap items-center gap-3 px-3 py-2">
              <button
                type="button"
                className="flex min-w-0 flex-1 items-center gap-2 text-start"
                onClick={() => setOpenId((current) => (current === lesson.id ? null : lesson.id))}
                aria-expanded={openId === lesson.id}
              >
                {openId === lesson.id ? (
                  <ChevronDown aria-hidden="true" className="size-4 shrink-0 text-muted" />
                ) : (
                  <ChevronRight aria-hidden="true" className="size-4 shrink-0 text-muted" />
                )}
                <span className="truncate font-medium text-foreground">{lesson.title}</span>
                <Badge tone={lesson.is_published ? "success" : "neutral"} className="normal-case">
                  {lesson.is_published ? "Published" : "Draft"}
                </Badge>
              </button>
              <span className="font-mono text-xs text-muted">{lesson.estimated_minutes} min</span>
            </div>
            {openId === lesson.id ? (
              <LessonEditor
                lessonId={lesson.id}
                onSaved={replaceLesson}
                onDeleted={removeLesson}
              />
            ) : null}
          </li>
        ))}
      </ol>

      <form
        className="flex flex-wrap items-end gap-2 border-t border-border pt-3"
        onSubmit={(event) => {
          event.preventDefault();
          void addLesson();
        }}
      >
        <div className="min-w-0 flex-1">
          <Label htmlFor="new-lesson-title" className="mb-1 block text-xs text-muted">
            New lesson title
          </Label>
          <Input
            id="new-lesson-title"
            value={newTitle}
            onChange={(event) => setNewTitle(event.target.value)}
            placeholder="e.g. Identifying encoded traffic"
          />
        </div>
        <Button type="submit" variant="secondary" size="sm" disabled={pending}>
          <Plus aria-hidden="true" className="size-4" />
          {pending ? "Adding…" : "Add lesson"}
        </Button>
      </form>
    </section>
  );
}

function LessonEditor({
  lessonId,
  onSaved,
  onDeleted,
}: {
  lessonId: number;
  onSaved: (lesson: AdminLesson) => void;
  onDeleted: (id: number) => void;
}) {
  const [lesson, setLesson] = useState<AdminLesson | null>(null);
  const [draft, setDraft] = useState<{
    title: string;
    summary: string;
    content: string;
    estimated_minutes: number;
    is_published: boolean;
  } | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    let alive = true;
    getAdminLesson(lessonId).then((loaded) => {
      if (!alive || !loaded) return;
      setLesson(loaded);
      setDraft({
        title: loaded.title,
        summary: loaded.summary ?? "",
        content: loaded.content,
        estimated_minutes: loaded.estimated_minutes,
        is_published: loaded.is_published,
      });
    });
    return () => {
      alive = false;
    };
  }, [lessonId]);

  async function save() {
    if (!draft) return;
    setPending(true);
    setError(null);
    const result = await updateAdminLesson(lessonId, {
      title: draft.title,
      summary: draft.summary.trim() === "" ? null : draft.summary.trim(),
      content: draft.content,
      estimated_minutes: Math.max(0, draft.estimated_minutes),
      is_published: draft.is_published,
    });
    setPending(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    const updated = { ...lesson, ...result.data } as AdminLesson;
    setLesson(updated);
    onSaved(updated);
  }

  async function remove() {
    setPending(true);
    setError(null);
    const result = await deleteAdminLesson(lessonId);
    setPending(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    onDeleted(lessonId);
  }

  if (!draft) {
    return <p className="border-t border-border px-3 py-4 text-sm text-muted">Loading lesson…</p>;
  }

  return (
    <div className="border-t border-border p-4">
      <section aria-labelledby="lesson-fields" className="grid gap-3 lg:grid-cols-2">
        <h3 id="lesson-fields" className="sr-only">
          Lesson fields
        </h3>
        <div className="lg:col-span-2">
          <Label htmlFor={`lesson-title-${lessonId}`} className="mb-1 block text-xs text-muted">
            Title
          </Label>
          <Input
            id={`lesson-title-${lessonId}`}
            value={draft.title}
            onChange={(event) => setDraft({ ...draft, title: event.target.value })}
          />
        </div>
        <div className="lg:col-span-2">
          <Label htmlFor={`lesson-summary-${lessonId}`} className="mb-1 block text-xs text-muted">
            Summary (learner-facing)
          </Label>
          <Input
            id={`lesson-summary-${lessonId}`}
            value={draft.summary}
            onChange={(event) => setDraft({ ...draft, summary: event.target.value })}
          />
        </div>
        <div>
          <Label htmlFor={`lesson-minutes-${lessonId}`} className="mb-1 block text-xs text-muted">
            Estimated minutes
          </Label>
          <Input
            id={`lesson-minutes-${lessonId}`}
            type="number"
            min={0}
            max={10000}
            value={draft.estimated_minutes}
            onChange={(event) =>
              setDraft({ ...draft, estimated_minutes: Number(event.target.value) })
            }
          />
        </div>
        <div className="flex items-end gap-3">
          <label className="inline-flex h-10 cursor-pointer items-center gap-2 text-sm text-muted">
            <input
              type="checkbox"
              className="size-4"
              checked={draft.is_published}
              onChange={() => setDraft({ ...draft, is_published: !draft.is_published })}
            />
            Published to learners
          </label>
          {confirmDelete ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted">Delete this lesson?</span>
              <Button type="button" variant="danger" size="sm" disabled={pending} onClick={() => void remove()}>
                <Trash2 aria-hidden="true" className="size-4" />
                Confirm
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>
                Keep
              </Button>
            </div>
          ) : (
            <Button type="button" variant="ghost" size="sm" onClick={() => setConfirmDelete(true)}>
              <Trash2 aria-hidden="true" className="size-4" />
              Delete lesson
            </Button>
          )}
        </div>
      </section>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <div>
          <Label htmlFor={`lesson-content-${lessonId}`} className="mb-1 block text-xs text-muted">
            Content (markdown)
          </Label>
          <Textarea
            id={`lesson-content-${lessonId}`}
            className="min-h-72 font-mono text-xs"
            value={draft.content}
            onChange={(event) => setDraft({ ...draft, content: event.target.value })}
          />
        </div>
        <div>
          <span className="mb-1 block text-xs text-muted">Learner preview</span>
          <div className="min-h-72 rounded-md border border-border bg-surface-raised p-3">
            <MarkdownContent content={draft.content} />
          </div>
        </div>
      </div>

      {error ? (
        <p role="alert" className="mt-2 text-sm text-danger">
          {error}
        </p>
      ) : null}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button type="button" variant="primary" size="sm" onClick={() => void save()} disabled={pending}>
          {pending ? "Saving…" : "Save lesson"}
        </Button>
      </div>

      <section aria-labelledby="lesson-quiz" className="mt-5 border-t border-border pt-4">
        <h3 id="lesson-quiz" className="type-eyebrow text-accent">
          Quiz
        </h3>
        <div className="mt-3">
          <QuizBuilder
            initialQuiz={lesson?.quiz ?? null}
            lessonId={lessonId}
          />
        </div>
      </section>

      <section aria-labelledby="lesson-challenges" className="mt-5 border-t border-border pt-4">
        <h3 id="lesson-challenges" className="type-eyebrow text-accent">
          Linked challenges
        </h3>
        <div className="mt-3">
          <LinkedChallenges lessonId={lessonId} initialLinks={lesson?.challenges ?? []} />
        </div>
      </section>
    </div>
  );
}
