"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useId, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { DIFFICULTIES, difficultyLabel } from "@/lib/format";
import type { Category, Tag } from "@/lib/types";

export function ChallengeFilters({
  categories,
  tags,
}: {
  categories: Category[];
  tags: Tag[];
}) {
  const id = useId();
  const router = useRouter();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  function apply(form: HTMLFormElement) {
    const data = new FormData(form);
    const next = new URLSearchParams();
    for (const key of ["q", "category", "difficulty", "tags", "solved"]) {
      const v = String(data.get(key) ?? "").trim();
      if (v) next.set(key, v);
    }
    startTransition(() => {
      router.push(`/challenges${next.toString() ? `?${next}` : ""}`);
    });
  }

  return (
    <form
      className="grid gap-3 border border-border bg-surface p-4 sm:grid-cols-2 lg:grid-cols-5"
      onSubmit={(e) => {
        e.preventDefault();
        apply(e.currentTarget);
      }}
      aria-label="Filter challenges"
    >
      <Field label="Search" htmlFor={`${id}-q`} className="lg:col-span-2">
        <Input
          id={`${id}-q`}
          name="q"
          defaultValue={params.get("q") ?? ""}
          placeholder="Memory dump, strings…"
        />
      </Field>

      <Field label="Category" htmlFor={`${id}-category`}>
        <select
          id={`${id}-category`}
          name="category"
          defaultValue={params.get("category") ?? ""}
          className="flex h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
        >
          <option value="">All</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Difficulty" htmlFor={`${id}-difficulty`}>
        <select
          id={`${id}-difficulty`}
          name="difficulty"
          defaultValue={params.get("difficulty") ?? ""}
          className="flex h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
        >
          <option value="">All</option>
          {DIFFICULTIES.map((d) => (
            <option key={d} value={d}>
              {difficultyLabel(d)}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Tag" htmlFor={`${id}-tags`}>
        <select
          id={`${id}-tags`}
          name="tags"
          defaultValue={params.get("tags") ?? ""}
          className="flex h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
        >
          <option value="">All</option>
          {tags.map((t) => (
            <option key={t.id} value={t.slug}>
              {t.name}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Solved" htmlFor={`${id}-solved`}>
        <select
          id={`${id}-solved`}
          name="solved"
          defaultValue={params.get("solved") ?? ""}
          className="flex h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
        >
          <option value="">Any</option>
          <option value="true">Solved</option>
          <option value="false">Unsolved</option>
        </select>
      </Field>

      <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-5">
        <Button type="submit" disabled={pending}>
          {pending ? "Filtering…" : "Apply filters"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => startTransition(() => router.push("/challenges"))}
        >
          Clear
        </Button>
      </div>
    </form>
  );
}
