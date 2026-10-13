"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input, Label, Textarea } from "@/components/ui/input";
import {
  ADMIN_DIFFICULTIES,
  createAdminChallenge,
  updateAdminChallenge,
  type AdminChallengeInput,
} from "@/lib/api/admin";
import { cn } from "@/lib/utils";
import type { Difficulty } from "@/lib/types";

export interface ChallengeFormInitial {
  title: string;
  slug: string;
  description: string;
  scenario: string;
  category_id: number | null;
  difficulty: Difficulty;
  points: number | null;
}

export interface CategoryOption {
  id: number;
  name: string;
  slug: string;
}

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MAX_POINTS = 100000;

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

/**
 * Client-side validation shared by create/edit. Returns per-field messages
 * keyed by input name (`category_id` for the category select).
 */
export function validateChallengeInput(input: {
  title: string;
  slug: string;
  description: string;
  category_id: number | null;
  points: number | null;
}): Record<string, string> {
  const errors: Record<string, string> = {};
  if (input.title.trim().length < 3) {
    errors.title = "Title is required (at least 3 characters).";
  }
  if (!input.slug.trim()) {
    errors.slug = "Slug is required.";
  } else if (!SLUG_RE.test(input.slug.trim())) {
    errors.slug =
      "Slug must be lowercase letters, numbers and hyphens (e.g. memory-forensics-101).";
  }
  if (!input.description.trim()) {
    errors.description = "Description is required.";
  }
  if (input.category_id === null) {
    errors.category_id = "Choose a category.";
  }
  if (input.points === null || !Number.isInteger(input.points)) {
    errors.points = "Points must be a whole number.";
  } else if (input.points < 1 || input.points > MAX_POINTS) {
    errors.points = `Points must be between 1 and ${MAX_POINTS}.`;
  }
  return errors;
}

const EMPTY: ChallengeFormInitial = {
  title: "",
  slug: "",
  description: "",
  scenario: "",
  category_id: null,
  difficulty: "beginner",
  points: null,
};

/**
 * Create/edit form island for admin challenges. Covers the writable fields
 * only — status transitions and flags live in their own islands/endpoints.
 */
export function ChallengeForm({
  mode,
  challengeId,
  initial = EMPTY,
  categories,
}: {
  mode: "create" | "edit";
  challengeId?: number;
  initial?: ChallengeFormInitial;
  categories: CategoryOption[];
}) {
  const router = useRouter();
  const [title, setTitle] = useState(initial.title);
  const [slug, setSlug] = useState(initial.slug);
  const [slugTouched, setSlugTouched] = useState(initial.slug.length > 0);
  const [description, setDescription] = useState(initial.description);
  const [scenario, setScenario] = useState(initial.scenario);
  const [categoryId, setCategoryId] = useState<number | null>(
    initial.category_id,
  );
  const [difficulty, setDifficulty] = useState<Difficulty>(initial.difficulty);
  const [points, setPoints] = useState(
    initial.points === null ? "" : String(initial.points),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function onTitleChange(value: string) {
    setTitle(value);
    if (!slugTouched) setSlug(slugify(value));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pending) return;
    setFormError(null);
    setSuccess(null);

    const parsedPoints = points.trim() === "" ? null : Number(points.trim());
    const clientErrors = validateChallengeInput({
      title,
      slug,
      description,
      category_id: categoryId,
      points:
        parsedPoints === null || Number.isNaN(parsedPoints)
          ? null
          : parsedPoints,
    });
    setErrors(clientErrors);
    if (Object.keys(clientErrors).length > 0) return;

    const payload: AdminChallengeInput = {
      title: title.trim(),
      slug: slug.trim(),
      description: description.trim(),
      scenario: scenario.trim() ? scenario.trim() : null,
      category_id: categoryId as number,
      difficulty,
      points: parsedPoints as number,
    };

    setPending(true);
    const result =
      mode === "create"
        ? await createAdminChallenge(payload)
        : await updateAdminChallenge(challengeId as number, payload);
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

    if (mode === "create") {
      router.push(`/admin/challenges/${result.data.id}`);
      router.refresh();
    } else {
      setSuccess("Challenge saved.");
      router.refresh();
    }
  }

  const selectClass = cn(
    "flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm",
    "text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60",
    "disabled:cursor-not-allowed disabled:opacity-50",
  );

  return (
    <form onSubmit={onSubmit} noValidate aria-label={mode === "create" ? "Create challenge" : "Edit challenge"}>
      {formError ? (
        <p role="alert" className="mb-4 rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
          {formError}
        </p>
      ) : null}
      {success ? (
        <p role="status" className="mb-4 rounded-md border border-success/40 bg-success/10 px-3 py-2 text-sm text-success">
          {success}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Title" htmlFor="challenge-title" error={errors.title}>
          <Input
            id="challenge-title"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="Memory Forensics 101"
            autoComplete="off"
            aria-invalid={errors.title ? true : undefined}
          />
        </Field>
        <Field label="Slug" htmlFor="challenge-slug" error={errors.slug}>
          <Input
            id="challenge-slug"
            value={slug}
            onChange={(e) => {
              setSlug(e.target.value);
              setSlugTouched(true);
            }}
            placeholder="memory-forensics-101"
            autoComplete="off"
            aria-invalid={errors.slug ? true : undefined}
            aria-describedby="challenge-slug-hint"
          />
          <p id="challenge-slug-hint" className="text-xs text-faint">
            Lowercase letters, numbers and hyphens. Used in public URLs.
          </p>
        </Field>
      </div>

      <div className="mt-4">
        <Field label="Description" htmlFor="challenge-description" error={errors.description}>
          <Textarea
            id="challenge-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What the solver has to do, tools allowed, deliverable…"
            rows={5}
            aria-invalid={errors.description ? true : undefined}
          />
        </Field>
      </div>

      <div className="mt-4">
        <Field label="Scenario (optional)" htmlFor="challenge-scenario">
          <Textarea
            id="challenge-scenario"
            value={scenario}
            onChange={(e) => setScenario(e.target.value)}
            placeholder="Story context shown on the challenge page…"
            rows={3}
          />
        </Field>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="challenge-category">Category</Label>
          <select
            id="challenge-category"
            className={selectClass}
            value={categoryId === null ? "" : String(categoryId)}
            onChange={(e) =>
              setCategoryId(e.target.value === "" ? null : Number(e.target.value))
            }
            aria-invalid={errors.category_id ? true : undefined}
          >
            <option value="">Select…</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          {categories.length === 0 ? (
            <p className="text-xs text-faint">
              No categories available — the API may be unreachable.
            </p>
          ) : null}
          {errors.category_id ? (
            <p role="alert" className="text-xs text-danger">
              {errors.category_id}
            </p>
          ) : null}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="challenge-difficulty">Difficulty</Label>
          <select
            id="challenge-difficulty"
            className={selectClass}
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as Difficulty)}
          >
            {ADMIN_DIFFICULTIES.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
        <Field label="Points" htmlFor="challenge-points" error={errors.points}>
          <Input
            id="challenge-points"
            type="number"
            min={1}
            max={MAX_POINTS}
            step={1}
            value={points}
            onChange={(e) => setPoints(e.target.value)}
            placeholder="150"
            inputMode="numeric"
            aria-invalid={errors.points ? true : undefined}
          />
        </Field>
      </div>

      <div className="mt-6">
        <Button type="submit" disabled={pending}>
          {pending
            ? "Saving…"
            : mode === "create"
              ? "Create challenge"
              : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
