"use client";

import { useRouter } from "next/navigation";
import { useId, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";
import { api } from "@/lib/api/client";
import { errorMessage } from "@/lib/errors";
import type { Category } from "@/lib/types";

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function CategoryCreateForm() {
  const id = useId();
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#3B82F6");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="mt-6 grid max-w-xl gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        startTransition(async () => {
          try {
            await api.post("/admin/categories", {
              name,
              slug: slug || slugify(name),
              description: description || null,
              color,
            });
            setName("");
            setSlug("");
            setDescription("");
            router.refresh();
          } catch (err) {
            setError(errorMessage(err));
          }
        });
      }}
    >
      <Field label="Name" htmlFor={`${id}-name`}>
        <Input
          id={`${id}-name`}
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setSlug(slugify(e.target.value));
          }}
          required
        />
      </Field>
      <Field label="Slug" htmlFor={`${id}-slug`}>
        <Input id={`${id}-slug`} value={slug} onChange={(e) => setSlug(e.target.value)} required />
      </Field>
      <Field label="Description" htmlFor={`${id}-desc`}>
        <Textarea
          id={`${id}-desc`}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </Field>
      <Field label="Color" htmlFor={`${id}-color`}>
        <Input
          id={`${id}-color`}
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
        />
      </Field>
      {error ? (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Creating…" : "Add category"}
      </Button>
    </form>
  );
}

export function CategoryList({ categories }: { categories: Category[] }) {
  return (
    <ul className="mt-8 divide-y divide-border border-t border-border">
      {categories.map((c) => (
        <li key={c.id} className="flex items-center justify-between gap-3 py-3">
          <div className="flex items-center gap-3">
            <span
              className="size-3 rounded-full"
              style={{ background: c.color ?? "var(--accent)" }}
              aria-hidden="true"
            />
            <div>
              <p className="font-semibold">{c.name}</p>
              <p className="font-mono text-xs text-faint">{c.slug}</p>
            </div>
          </div>
          <span className="font-mono text-xs text-muted">
            {c.challenge_count ?? 0} challenges
          </span>
        </li>
      ))}
    </ul>
  );
}
