"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useId, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Form, FormError } from "@/components/ui/form";
import { Field, Input } from "@/components/ui/input";
import { tagCreateSchema, type TagCreateInput } from "@/lib/admin/schemas";
import { api } from "@/lib/api/client";
import { applyServerError } from "@/lib/forms/server-errors";
import type { Tag } from "@/lib/types";

function slugify(value: string): string {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function TagCreateForm() {
  const id = useId();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const form = useForm<TagCreateInput>({
    resolver: zodResolver(tagCreateSchema),
    defaultValues: { name: "", slug: "" },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setError(null);
    try {
      await api.post("/admin/tags", { name: values.name, slug: values.slug || slugify(values.name) });
      form.reset();
      router.refresh();
    } catch (err) {
      setError(applyServerError(err, form.setError));
    }
  });

  return (
    <Form label="Add tag" onSubmit={onSubmit} pending={form.formState.isSubmitting} className="mt-6 flex max-w-xl flex-wrap items-end gap-3">
      <Field label="Name" htmlFor={`${id}-name`} error={form.formState.errors.name?.message} className="min-w-[140px] flex-1">
        <Input
          id={`${id}-name`}
          disabled={form.formState.isSubmitting}
          {...form.register("name", {
            onChange: (event) => {
              if (!form.formState.dirtyFields.slug) {
                form.setValue("slug", slugify(event.target.value), { shouldValidate: true });
              }
            },
          })}
        />
      </Field>
      <Field label="Slug" htmlFor={`${id}-slug`} error={form.formState.errors.slug?.message} className="min-w-[140px] flex-1">
        <Input id={`${id}-slug`} disabled={form.formState.isSubmitting} {...form.register("slug")} />
      </Field>
      <Button type="submit" loading={form.formState.isSubmitting}>
        Add tag
      </Button>
      <FormError className="w-full">{error}</FormError>
    </Form>
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
