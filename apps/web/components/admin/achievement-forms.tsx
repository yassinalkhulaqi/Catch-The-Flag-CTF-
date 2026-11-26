"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useId, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import {
  achievementCreateSchema,
  achievementEditSchema,
  type AchievementCreateInput,
  type AchievementEditInput,
} from "@/lib/admin/schemas";
import { api } from "@/lib/api/client";
import { applyServerError } from "@/lib/forms/server-errors";
import { errorMessage } from "@/lib/errors";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Form, FormError, SelectField } from "@/components/ui/form";
import { Field, Input, Textarea } from "@/components/ui/input";
import type {
  AchievementCriteriaType,
  AdminAchievement,
  Category,
} from "@/lib/types";

const CRITERIA: Array<{
  value: AchievementCriteriaType;
  label: string;
  thresholdLabel: string;
}> = [
  { value: "solves_total", label: "Total solves", thresholdLabel: "Solves required" },
  { value: "xp_total", label: "Total XP", thresholdLabel: "XP required" },
  { value: "paths_completed", label: "Paths completed", thresholdLabel: "Paths required" },
  {
    value: "category_solves",
    label: "Solves in a category",
    thresholdLabel: "Solves required",
  },
  { value: "first_blood", label: "First bloods", thresholdLabel: "First bloods required" },
];

const criteriaOptions = CRITERIA.map((item) => ({ value: item.value, label: item.label }));

function toKey(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80);
}

function criteriaMeta(type: AchievementCriteriaType) {
  return CRITERIA.find((item) => item.value === type) ?? CRITERIA[0];
}

export function describeCriteria(
  achievement: Pick<AdminAchievement, "criteria">,
  categories: Category[],
): string {
  const { type, threshold, category_id: categoryId } = achievement.criteria;
  const count = threshold;
  switch (type) {
    case "solves_total":
      return `Solve ${count} challenge${count === 1 ? "" : "s"}`;
    case "xp_total":
      return `Reach ${count} XP`;
    case "paths_completed":
      return `Complete ${count} path${count === 1 ? "" : "s"}`;
    case "category_solves": {
      const name = categories.find((c) => c.id === categoryId)?.name ?? "a category";
      return `Solve ${count} in ${name}`;
    }
    case "first_blood":
      return `Earn ${count} first blood${count === 1 ? "" : "s"}`;
    default:
      return type;
  }
}

export function AchievementCreateForm({ categories }: { categories: Category[] }) {
  const id = useId();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const defaults: AchievementCreateInput = {
    key: "",
    title: "",
    description: "",
    icon: "",
    criteria: {
      type: "solves_total",
      threshold: 1,
      ...(categories[0] ? { category_id: categories[0].id } : {}),
    },
    points: 0,
    sort_order: 0,
    is_active: true,
  };
  const form = useForm<AchievementCreateInput>({
    resolver: zodResolver(achievementCreateSchema),
    defaultValues: defaults,
  });
  const type = form.watch("criteria.type");
  const meta = criteriaMeta(type);
  const categoryOptions = [
    { value: "", label: categories.length === 0 ? "No categories" : "Choose a category" },
    ...categories.map((c) => ({ value: String(c.id), label: c.name })),
  ];

  return (
    <Form
      label="New achievement"
      className="mt-6 grid max-w-2xl gap-3"
      pending={form.formState.isSubmitting}
      onSubmit={form.handleSubmit(async (values) => {
        setError(null);
        try {
          await api.post("/admin/achievements", {
            key: values.key,
            title: values.title,
            description: values.description,
            icon: values.icon.trim() || null,
            criteria: values.criteria.type === "category_solves"
              ? {
                  type: values.criteria.type,
                  threshold: values.criteria.threshold,
                  category_id: values.criteria.category_id ?? categories[0]?.id ?? 0,
                }
              : { type: values.criteria.type, threshold: values.criteria.threshold },
            points: values.points,
            is_active: values.is_active,
            sort_order: values.sort_order,
          });
          form.reset(defaults);
          router.refresh();
        } catch (err) {
          setError(applyServerError(err, form.setError));
        }
      })}
    >
      <h2 className="text-sm font-semibold text-foreground">New achievement</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Title" htmlFor={`${id}-title`} error={form.formState.errors.title?.message}>
          <Input
            id={`${id}-title`}
            maxLength={160}
            {...form.register("title", {
              onChange: (event) => {
                if (!form.formState.dirtyFields.key) {
                  form.setValue("key", toKey(event.target.value), { shouldValidate: true });
                }
              },
            })}
          />
        </Field>
        <Field label="Key" htmlFor={`${id}-key`} error={form.formState.errors.key?.message}>
          <Input
            id={`${id}-key`}
            maxLength={80}
            title="Lowercase letters, numbers, and underscores"
            autoComplete="off"
            className="font-mono"
            {...form.register("key")}
          />
        </Field>
      </div>
      <Field label="Description" htmlFor={`${id}-description`} error={form.formState.errors.description?.message}>
        <Textarea id={`${id}-description`} maxLength={400} {...form.register("description")} />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <SelectField
          id={`${id}-type`}
          label="Criteria"
          options={criteriaOptions}
          {...form.register("criteria.type")}
        />
        <Field label={meta.thresholdLabel} htmlFor={`${id}-threshold`} error={form.formState.errors.criteria?.threshold?.message}>
          <Input
            id={`${id}-threshold`}
            type="number"
            min={1}
            max={1000000}
            {...form.register("criteria.threshold", { valueAsNumber: true })}
          />
        </Field>
      </div>
      {type === "category_solves" ? (
        <SelectField
          id={`${id}-category`}
          label="Category"
          options={categoryOptions}
          value={String(form.watch("criteria.category_id") ?? "")}
          onChange={(event) =>
            form.setValue("criteria.category_id", Number(event.target.value), { shouldValidate: true })
          }
        />
      ) : null}
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Icon" htmlFor={`${id}-icon`}>
          <Input id={`${id}-icon`} maxLength={60} placeholder="trophy" autoComplete="off" {...form.register("icon")} />
        </Field>
        <Field label="XP award" htmlFor={`${id}-points`} error={form.formState.errors.points?.message}>
          <Input id={`${id}-points`} type="number" min={0} max={10000} {...form.register("points", { valueAsNumber: true })} />
        </Field>
        <Field label="Sort order" htmlFor={`${id}-sort`} error={form.formState.errors.sort_order?.message}>
          <Input id={`${id}-sort`} type="number" min={0} max={10000} {...form.register("sort_order", { valueAsNumber: true })} />
        </Field>
      </div>
      <p className="text-xs text-muted">
        XP award of 0 uses the platform default. Lower sort order appears first. The key cannot be
        changed after creation.
      </p>
      <label className="flex items-center gap-2 text-sm text-foreground" htmlFor={`${id}-active`}>
        <input id={`${id}-active`} type="checkbox" className="size-4 accent-accent" {...form.register("is_active")} />
        Active (eligible for new awards)
      </label>
      <FormError>{error}</FormError>
      <Button type="submit" loading={form.formState.isSubmitting} className="w-fit">
        Add achievement
      </Button>
    </Form>
  );
}

export function AchievementList({
  items,
  categories,
  canDelete,
}: {
  items: AdminAchievement[];
  categories: Category[];
  canDelete: boolean;
}) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run(action: () => Promise<void>) {
    setError(null);
    startTransition(async () => {
      try {
        await action();
        router.refresh();
      } catch (err) {
        setError(errorMessage(err, "Could not update the achievement."));
      }
    });
  }

  return (
    <div className="mt-8">
      <FormError className="mb-3">{error}</FormError>
      <ul className="divide-y divide-border border-t border-border">
        {items.map((item) => (
          <li key={item.id} className="py-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold">{item.title}</p>
                  <Badge className="font-mono normal-case">{item.key}</Badge>
                  {item.is_active ? (
                    <Badge tone="success">Active</Badge>
                  ) : (
                    <Badge tone="danger">Inactive</Badge>
                  )}
                </div>
                <p className="mt-1 text-sm text-muted">{item.description}</p>
                <p className="mt-2 font-mono text-xs text-faint">
                  {describeCriteria(item, categories)}
                  {" · "}
                  {item.points > 0 ? `${item.points} XP` : "default XP"}
                  {" · "}
                  {item.awarded_count} awarded
                  {item.icon ? ` · ${item.icon}` : ""}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  aria-expanded={editingId === item.id}
                  disabled={pending}
                  onClick={() => setEditingId((current) => (current === item.id ? null : item.id))}
                >
                  {editingId === item.id ? "Close" : "Edit"}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={pending}
                  onClick={() => {
                    const next = !item.is_active;
                    if (
                      !next &&
                      !window.confirm(
                        `Deactivate “${item.title}”? Existing awards stay, and no new ones are given.`,
                      )
                    ) {
                      return;
                    }
                    run(() => api.put(`/admin/achievements/${item.id}`, { is_active: next }));
                  }}
                >
                  {item.is_active ? "Deactivate" : "Activate"}
                </Button>
                {canDelete ? (
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    disabled={pending}
                    onClick={() => {
                      if (
                        !window.confirm(
                          `Delete “${item.title}”? This removes the badge and all ${item.awarded_count} award${item.awarded_count === 1 ? "" : "s"}. Deactivate instead if you want to keep history.`,
                        )
                      ) {
                        return;
                      }
                      run(async () => {
                        await api.delete(`/admin/achievements/${item.id}`);
                        setEditingId((current) => (current === item.id ? null : current));
                      });
                    }}
                  >
                    Delete
                  </Button>
                ) : null}
              </div>
            </div>
            {editingId === item.id ? (
              <AchievementEditForm
                item={item}
                categories={categories}
                disabled={pending}
                onSave={(body) =>
                  run(async () => {
                    await api.put(`/admin/achievements/${item.id}`, body);
                    setEditingId(null);
                  })
                }
              />
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

function AchievementEditForm({
  item,
  categories,
  disabled,
  onSave,
}: {
  item: AdminAchievement;
  categories: Category[];
  disabled: boolean;
  onSave: (body: {
    title: string;
    description: string;
    icon: string | null;
    criteria: AdminAchievement["criteria"];
    points: number;
    sort_order: number;
  }) => void;
}) {
  const id = useId();
  const defaults: AchievementEditInput = {
    title: item.title,
    description: item.description,
    icon: item.icon ?? "",
    criteria: {
      type: item.criteria.type,
      threshold: item.criteria.threshold,
      category_id: item.criteria.category_id ?? categories[0]?.id,
    },
    points: item.points,
    sort_order: item.sort_order,
  };
  const form = useForm<AchievementEditInput>({
    resolver: zodResolver(achievementEditSchema),
    defaultValues: defaults,
  });
  const type = form.watch("criteria.type");
  const meta = criteriaMeta(type);

  return (
    <Form
      label={`Edit ${item.title}`}
      className="mt-4 grid max-w-2xl gap-3 border border-border bg-surface p-4"
      pending={form.formState.isSubmitting}
      onSubmit={form.handleSubmit((values) => {
        onSave({
          title: values.title,
          description: values.description,
          icon: values.icon.trim() || null,
          criteria: values.criteria.type === "category_solves"
            ? {
                type: values.criteria.type,
                threshold: values.criteria.threshold,
                category_id: values.criteria.category_id ?? categories[0]?.id ?? 0,
              }
            : { type: values.criteria.type, threshold: values.criteria.threshold },
          points: values.points,
          sort_order: values.sort_order,
        });
      })}
    >
      <Field label="Title" htmlFor={`${id}-title`} error={form.formState.errors.title?.message}>
        <Input id={`${id}-title`} maxLength={160} {...form.register("title")} />
      </Field>
      <Field label="Description" htmlFor={`${id}-description`} error={form.formState.errors.description?.message}>
        <Textarea id={`${id}-description`} maxLength={400} {...form.register("description")} />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <SelectField
          id={`${id}-type`}
          label="Criteria"
          options={criteriaOptions}
          {...form.register("criteria.type")}
        />
        <Field label={meta.thresholdLabel} htmlFor={`${id}-threshold`} error={form.formState.errors.criteria?.threshold?.message}>
          <Input id={`${id}-threshold`} type="number" min={1} max={1000000} {...form.register("criteria.threshold", { valueAsNumber: true })} />
        </Field>
      </div>
      {type === "category_solves" ? (
        <SelectField
          id={`${id}-category`}
          label="Category"
          options={categories.map((c) => ({ value: String(c.id), label: c.name }))}
          value={String(form.watch("criteria.category_id") ?? "")}
          onChange={(event) =>
            form.setValue("criteria.category_id", Number(event.target.value), { shouldValidate: true })
          }
        />
      ) : null}
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Icon" htmlFor={`${id}-icon`}>
          <Input id={`${id}-icon`} maxLength={60} {...form.register("icon")} />
        </Field>
        <Field label="XP award" htmlFor={`${id}-points`} error={form.formState.errors.points?.message}>
          <Input id={`${id}-points`} type="number" min={0} max={10000} {...form.register("points", { valueAsNumber: true })} />
        </Field>
        <Field label="Sort order" htmlFor={`${id}-sort`} error={form.formState.errors.sort_order?.message}>
          <Input id={`${id}-sort`} type="number" min={0} max={10000} {...form.register("sort_order", { valueAsNumber: true })} />
        </Field>
      </div>
      <Button type="submit" size="sm" loading={form.formState.isSubmitting || disabled} className="w-fit">
        Save changes
      </Button>
    </Form>
  );
}
