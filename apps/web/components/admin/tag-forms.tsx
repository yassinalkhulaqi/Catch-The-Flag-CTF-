"use client";

import { useRouter } from "next/navigation";
import { useId, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { api } from "@/lib/api/client";
import { errorMessage } from "@/lib/errors";
import type { Tag } from "@/lib/types";

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function TagCreateForm() {
  const id = useId();
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="mt-6 flex max-w-xl flex-wrap items-end gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        startTransition(async () => {
          try {
            await api.post("/admin/tags", { name, slug: slug || slugify(name) });
            setName("");
            setSlug("");
            router.refresh();
          } catch (err) {
            setError(errorMessage(err));
          }
        });
      }}
    >
      <Field label="Name" htmlFor={`${id}-name`} className="min-w-[140px] flex-1">
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
      <Field label="Slug" htmlFor={`${id}-slug`} className="min-w-[140px] flex-1">
        <Input id={`${id}-slug`} value={slug} onChange={(e) => setSlug(e.target.value)} required />
      </Field>
      <Button type="submit" disabled={pending}>
        {pending ? "Adding…" : "Add tag"}
      </Button>
      {error ? (
        <p role="alert" className="w-full text-sm text-danger">
          {error}
        </p>
      ) : null}
    </form>
  );
}

export function TagList({ tags }: { tags: Tag[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <ul className="mt-8 flex flex-wrap gap-2">
      {tags.map((t) => (
        <li key={t.id} className="inline-flex items-center gap-2 border border-border px-3 py-1.5 text-sm">
          <span className="font-mono text-xs text-muted">{t.slug}</span>
          <span>{t.name}</span>
          <button
            type="button"
            className="text-xs text-danger hover:underline"
            disabled={pending}
            onClick={() => {
              startTransition(async () => {
                await api.delete(`/admin/tags/${t.id}`);
                router.refresh();
              });
            }}
          >
            Delete
          </button>
        </li>
      ))}
    </ul>
  );
}
