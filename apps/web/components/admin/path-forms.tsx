"use client";

import { useRouter } from "next/navigation";
import { useId, useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";
import { api } from "@/lib/api/client";
import { errorMessage } from "@/lib/errors";
import { DIFFICULTIES, difficultyLabel } from "@/lib/format";
import type { Category, Difficulty, PathDetail, PathSummary } from "@/lib/types";

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 160);
}

export function PathCreateForm({ categories }: { categories: Category[] }) {
  const id = useId();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [summary, setSummary] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("beginner");
  const [categoryId, setCategoryId] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="mt-6 grid max-w-2xl gap-3 border border-border bg-surface p-4"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        startTransition(async () => {
          try {
            const res = await api.post<{ data: PathSummary }>("/admin/paths", {
              title,
              slug: slug || slugify(title),
              summary,
              difficulty,
              category_id: categoryId ? Number(categoryId) : null,
            });
            router.push(`/admin/paths/${res.data.id}/edit`);
            router.refresh();
          } catch (err) {
            setError(errorMessage(err));
          }
        });
      }}
    >
      <h2 className="font-mono text-xs uppercase tracking-[0.16em] text-accent">
        New path
      </h2>
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Title" htmlFor={`${id}-title`}>
          <Input
            id={`${id}-title`}
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setSlug(slugify(e.target.value));
            }}
            required
          />
        </Field>
        <Field label="Slug" htmlFor={`${id}-slug`}>
          <Input
            id={`${id}-slug`}
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            required
          />
        </Field>
        <Field label="Difficulty" htmlFor={`${id}-diff`}>
          <select
            id={`${id}-diff`}
            className="flex h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as Difficulty)}
          >
            {DIFFICULTIES.map((d) => (
              <option key={d} value={d}>
                {difficultyLabel(d)}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Category (optional)" htmlFor={`${id}-cat`}>
          <select
            id={`${id}-cat`}
            className="flex h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            <option value="">None</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <Field label="Summary" htmlFor={`${id}-summary`}>
        <Textarea
          id={`${id}-summary`}
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          required
          maxLength={400}
        />
      </Field>
      {error ? (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Creating…" : "Create path"}
      </Button>
    </form>
  );
}

export function PathEditor({
  path,
  categories,
}: {
  path: PathDetail | PathSummary;
  categories: Category[];
}) {
  const id = useId();
  const router = useRouter();
  const [title, setTitle] = useState(path.title);
  const [slug, setSlug] = useState(path.slug);
  const [summary, setSummary] = useState(path.summary);
  const [difficulty, setDifficulty] = useState<Difficulty>(path.difficulty);
  const [categoryId, setCategoryId] = useState(
    String(path.category?.id ?? ""),
  );
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  function save() {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      try {
        await api.put(`/admin/paths/${path.id}`, {
          title,
          slug,
          summary,
          difficulty,
          category_id: categoryId ? Number(categoryId) : null,
        });
        setMessage("Path saved.");
        router.refresh();
      } catch (err) {
        setError(errorMessage(err));
      }
    });
  }

  function statusAction(action: "publish" | "unpublish" | "archive" | "review") {
    if (!window.confirm(`Mark this path as ${action}?`)) return;
    setError(null);
    setMessage(null);
    startTransition(async () => {
      try {
        await api.post(`/admin/paths/${path.id}/${action}`);
        setMessage(`Path ${action}ed.`);
        router.refresh();
      } catch (err) {
        setError(errorMessage(err));
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <Badge>{path.status}</Badge>
        <span className="font-mono text-xs text-faint">
          {path.module_count} modules · {path.lesson_count} lessons
        </span>
      </div>

      {error ? (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}
      {message ? (
        <p role="status" className="text-sm text-success">
          {message}
        </p>
      ) : null}

      <div className="grid max-w-2xl gap-3">
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Title" htmlFor={`${id}-title`}>
            <Input
              id={`${id}-title`}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </Field>
          <Field label="Slug" htmlFor={`${id}-slug`}>
            <Input
              id={`${id}-slug`}
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              required
            />
          </Field>
          <Field label="Difficulty" htmlFor={`${id}-diff`}>
            <select
              id={`${id}-diff`}
              className="flex h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as Difficulty)}
            >
              {DIFFICULTIES.map((d) => (
                <option key={d} value={d}>
                  {difficultyLabel(d)}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Category (optional)" htmlFor={`${id}-cat`}>
            <select
              id={`${id}-cat`}
              className="flex h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              <option value="">None</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Summary" htmlFor={`${id}-summary`}>
          <Textarea
            id={`${id}-summary`}
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            required
            maxLength={400}
          />
        </Field>
        <Button onClick={save} disabled={pending}>
          {pending ? "Saving…" : "Save changes"}
        </Button>
      </div>

      <section aria-labelledby={`${id}-status`}>
        <h2
          id={`${id}-status`}
          className="font-mono text-xs uppercase tracking-[0.16em] text-accent"
        >
          Status actions
        </h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            variant="primary"
            size="sm"
            disabled={pending || path.status === "published"}
            onClick={() => statusAction("publish")}
          >
            Publish
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={pending || path.status === "draft"}
            onClick={() => statusAction("unpublish")}
          >
            Unpublish
          </Button>
          <Button
            variant="secondary"
            size="sm"
            disabled={pending || path.status === "review"}
            onClick={() => statusAction("review")}
          >
            Send to review
          </Button>
          <Button
            variant="danger"
            size="sm"
            disabled={pending || path.status === "archived"}
            onClick={() => statusAction("archive")}
          >
            Archive
          </Button>
        </div>
      </section>
    </div>
  );
}
