"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Form, FormError } from "@/components/ui/form";
import { Field, Input, Textarea } from "@/components/ui/input";
import { categoryCreateSchema, type CategoryCreateInput } from "@/lib/admin/schemas";
import { api } from "@/lib/api/client";
import { applyServerError } from "@/lib/forms/server-errors";
import type { Category } from "@/lib/types";

function slugify(value: string): string {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function CategoryCreateForm() {
  const id = useId();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const form = useForm<CategoryCreateInput>({
    resolver: zodResolver(categoryCreateSchema),
    defaultValues: { name: "", slug: "", description: "", color: "#3B82F6" },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setError(null);
    try {
      await api.post("/admin/categories", {
        name: values.name,
        slug: values.slug || slugify(values.name),
        description: values.description || null,
        color: values.color,
      });
      form.reset();
      router.refresh();
    } catch (err) {
      setError(applyServerError(err, form.setError));
    }
  });

  return (
    <Form label="Add category" onSubmit={onSubmit} pending={form.formState.isSubmitting} className="mt-6 grid max-w-xl gap-3">
      <Field label="Name" htmlFor={`${id}-name`} error={form.formState.errors.name?.message}>
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
      <Field label="Slug" htmlFor={`${id}-slug`} error={form.formState.errors.slug?.message}>
        <Input id={`${id}-slug`} disabled={form.formState.isSubmitting} {...form.register("slug")} />
      </Field>
      <Field label="Description" htmlFor={`${id}-desc`} error={form.formState.errors.description?.message}>
        <Textarea id={`${id}-desc`} maxLength={500} disabled={form.formState.isSubmitting} {...form.register("description")} />
      </Field>
      <Field label="Color" htmlFor={`${id}-color`}>
        <Input id={`${id}-color`} type="color" disabled={form.formState.isSubmitting} {...form.register("color")} />
      </Field>
      <FormError>{error}</FormError>
      <Button type="submit" loading={form.formState.isSubmitting}>
        Add category
      </Button>
    </Form>
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
