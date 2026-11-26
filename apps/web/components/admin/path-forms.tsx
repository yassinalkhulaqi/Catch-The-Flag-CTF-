"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useId, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { pathCreateSchema, type PathCreateInput } from "@/lib/admin/schemas";
import { api } from "@/lib/api/client";
import { applyServerError } from "@/lib/forms/server-errors";
import { DIFFICULTIES, difficultyLabel } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Form, FormError, FormSuccess, SelectField } from "@/components/ui/form";
import { Field, Input, Textarea } from "@/components/ui/input";
import type { Category, PathDetail, PathSummary } from "@/lib/types";

function slugify(value: string): string {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 160);
}

const difficultyOptions = DIFFICULTIES.map((d) => ({ value: d, label: difficultyLabel(d) }));

export function PathCreateForm({ categories }: { categories: Category[] }) {
  const id = useId();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const form = useForm<PathCreateInput>({
    resolver: zodResolver(pathCreateSchema),
    defaultValues: { title: "", slug: "", summary: "", difficulty: "beginner", category_id: null },
  });

  return (
    <Form
      label="New path"
      className="mt-6 grid max-w-2xl gap-3 border border-border bg-surface p-4"
      pending={form.formState.isSubmitting}
      onSubmit={form.handleSubmit(async (values) => {
        setError(null);
        try {
          const res = await api.post<{ data: PathSummary }>("/admin/paths", values);
          router.push(`/admin/paths/${res.data.id}/edit`);
          router.refresh();
        } catch (err) {
          setError(applyServerError(err, form.setError));
        }
      })}
    >
      <h2 className="font-mono text-xs uppercase tracking-[0.16em] text-accent">New path</h2>
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Title" htmlFor={`${id}-title`} error={form.formState.errors.title?.message}>
          <Input
            id={`${id}-title`}
            {...form.register("title", {
              onChange: (event) => {
                if (!form.formState.dirtyFields.slug) {
                  form.setValue("slug", slugify(event.target.value), { shouldValidate: true });
                }
              },
            })}
          />
        </Field>
        <Field label="Slug" htmlFor={`${id}-slug`} error={form.formState.errors.slug?.message}>
          <Input id={`${id}-slug`} {...form.register("slug")} />
        </Field>
        <SelectField
          id={`${id}-diff`}
          label="Difficulty"
          options={difficultyOptions}
          {...form.register("difficulty")}
        />
        <SelectField
          id={`${id}-cat`}
          label="Category (optional)"
          options={[{ value: "", label: "None" }, ...categories.map((c) => ({ value: String(c.id), label: c.name }))]}
          onChange={(event) =>
            form.setValue("category_id", event.target.value ? Number(event.target.value) : null, {
              shouldValidate: true,
            })
          }
        />
      </div>
      <Field label="Summary" htmlFor={`${id}-summary`} error={form.formState.errors.summary?.message}>
        <Textarea id={`${id}-summary`} maxLength={400} {...form.register("summary")} />
      </Field>
      <FormError>{error}</FormError>
      <Button type="submit" loading={form.formState.isSubmitting}>
        Create path
      </Button>
    </Form>
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
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const form = useForm<PathCreateInput>({
    resolver: zodResolver(pathCreateSchema),
    defaultValues: {
      title: path.title,
      slug: path.slug,
      summary: path.summary,
      difficulty: path.difficulty,
      category_id: path.category?.id ?? null,
    },
  });

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
        setError(applyServerError(err, form.setError));
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

      <FormError>{error}</FormError>
      <FormSuccess>{message}</FormSuccess>

      <Form
        label="Edit path"
        className="grid max-w-2xl gap-3"
        pending={form.formState.isSubmitting || pending}
        onSubmit={form.handleSubmit(async (values) => {
          setError(null);
          setMessage(null);
          try {
            await api.put(`/admin/paths/${path.id}`, values);
            setMessage("Path saved.");
            router.refresh();
          } catch (err) {
            setError(applyServerError(err, form.setError));
          }
        })}
      >
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Title" htmlFor={`${id}-title`} error={form.formState.errors.title?.message}>
            <Input id={`${id}-title`} {...form.register("title")} />
          </Field>
          <Field label="Slug" htmlFor={`${id}-slug`} error={form.formState.errors.slug?.message}>
            <Input id={`${id}-slug`} {...form.register("slug")} />
          </Field>
          <SelectField
            id={`${id}-diff`}
            label="Difficulty"
            options={difficultyOptions}
            {...form.register("difficulty")}
          />
          <SelectField
            id={`${id}-cat`}
            label="Category (optional)"
            options={[{ value: "", label: "None" }, ...categories.map((c) => ({ value: String(c.id), label: c.name }))]}
            value={String(form.watch("category_id") ?? "")}
            onChange={(event) =>
              form.setValue("category_id", event.target.value ? Number(event.target.value) : null, {
                shouldValidate: true,
              })
            }
          />
        </div>
        <Field label="Summary" htmlFor={`${id}-summary`} error={form.formState.errors.summary?.message}>
          <Textarea id={`${id}-summary`} maxLength={400} {...form.register("summary")} />
        </Field>
        <Button type="submit" loading={form.formState.isSubmitting || pending}>
          Save changes
        </Button>
      </Form>

      <section aria-labelledby={`${id}-status`}>
        <h2 id={`${id}-status`} className="font-mono text-xs uppercase tracking-[0.16em] text-accent">
          Status actions
        </h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button variant="primary" size="sm" disabled={pending || path.status === "published"} onClick={() => statusAction("publish")}>Publish</Button>
          <Button variant="outline" size="sm" disabled={pending || path.status === "draft"} onClick={() => statusAction("unpublish")}>Unpublish</Button>
          <Button variant="secondary" size="sm" disabled={pending || path.status === "review"} onClick={() => statusAction("review")}>Send to review</Button>
          <Button variant="danger" size="sm" disabled={pending || path.status === "archived"} onClick={() => statusAction("archive")}>Archive</Button>
        </div>
      </section>
    </div>
  );
}
