"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";
import { createAdminPath } from "@/lib/api/admin";

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

/** Minimal path creation island (title/slug + optional copy). */
export function PathCreateForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [summary, setSummary] = useState("");
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pending) return;
    setFormError(null);

    const next: Record<string, string> = {};
    if (title.trim().length < 3) next.title = "Title is required (at least 3 characters).";
    if (!slug.trim()) next.slug = "Slug is required.";
    else if (!SLUG_RE.test(slug.trim())) {
      next.slug = "Slug must be lowercase letters, numbers and hyphens.";
    }
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setPending(true);
    const result = await createAdminPath({
      title: title.trim(),
      slug: slug.trim(),
      summary: summary.trim() ? summary.trim() : undefined,
      description: description.trim() ? description.trim() : undefined,
    });
    setPending(false);

    if (!result.ok) {
      const fieldErrors: Record<string, string> = {};
      for (const [key, messages] of Object.entries(result.fields ?? {})) {
        if (messages.length > 0) fieldErrors[key] = messages[0];
      }
      setErrors(fieldErrors);
      setFormError(result.message);
      return;
    }
    setTitle("");
    setSlug("");
    setSlugTouched(false);
    setSummary("");
    setDescription("");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} noValidate aria-label="Create path">
      {formError ? (
        <p role="alert" className="mb-3 text-sm text-danger">
          {formError}
        </p>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Title" htmlFor="path-title" error={errors.title}>
          <Input
            id="path-title"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (!slugTouched) setSlug(slugify(e.target.value));
            }}
            placeholder="DFIR Fundamentals"
            autoComplete="off"
            aria-invalid={errors.title ? true : undefined}
          />
        </Field>
        <Field label="Slug" htmlFor="path-slug" error={errors.slug}>
          <Input
            id="path-slug"
            value={slug}
            onChange={(e) => {
              setSlug(e.target.value);
              setSlugTouched(true);
            }}
            placeholder="dfir-fundamentals"
            autoComplete="off"
            aria-invalid={errors.slug ? true : undefined}
          />
        </Field>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <Field label="Summary (optional)" htmlFor="path-summary">
          <Input
            id="path-summary"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="One-line pitch for the path card…"
            autoComplete="off"
          />
        </Field>
        <Field label="Description (optional)" htmlFor="path-description">
          <Textarea
            id="path-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="Longer overview shown on the path page…"
          />
        </Field>
      </div>
      <div className="mt-3">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Creating…" : "Create path"}
        </Button>
      </div>
    </form>
  );
}
