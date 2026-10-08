"use client";

import { useRouter } from "next/navigation";
import { useId, useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";
import { api } from "@/lib/api/client";
import { errorMessage } from "@/lib/errors";
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

const selectClass =
  "flex h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60";

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

function criteriaPayload(
  type: AchievementCriteriaType,
  threshold: string,
  categoryId: string,
): AdminAchievement["criteria"] {
  const criteria: AdminAchievement["criteria"] = {
    type,
    threshold: Number(threshold),
  };
  if (type === "category_solves") {
    criteria.category_id = Number(categoryId);
  }
  return criteria;
}

export function AchievementCreateForm({ categories }: { categories: Category[] }) {
  const id = useId();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [key, setKey] = useState("");
  const [keyTouched, setKeyTouched] = useState(false);
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("");
  const [type, setType] = useState<AchievementCriteriaType>("solves_total");
  const [threshold, setThreshold] = useState("1");
  const [categoryId, setCategoryId] = useState(categories[0] ? String(categories[0].id) : "");
  const [points, setPoints] = useState("0");
  const [sortOrder, setSortOrder] = useState("0");
  const [active, setActive] = useState(true);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const meta = criteriaMeta(type);

  function reset() {
    setTitle("");
    setKey("");
    setKeyTouched(false);
    setDescription("");
    setIcon("");
    setType("solves_total");
    setThreshold("1");
    setCategoryId(categories[0] ? String(categories[0].id) : "");
    setPoints("0");
    setSortOrder("0");
    setActive(true);
  }

  return (
    <form
      className="mt-6 grid max-w-2xl gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        startTransition(async () => {
          try {
            await api.post("/admin/achievements", {
              key,
              title,
              description,
              icon: icon.trim() || null,
              criteria: criteriaPayload(type, threshold, categoryId),
              points: Number(points),
              is_active: active,
              sort_order: Number(sortOrder),
            });
            reset();
            router.refresh();
          } catch (err) {
            setError(errorMessage(err, "Could not create the achievement."));
          }
        });
      }}
    >
      <h2 className="text-sm font-semibold text-foreground">New achievement</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Title" htmlFor={`${id}-title`}>
          <Input
            id={`${id}-title`}
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (!keyTouched) setKey(toKey(e.target.value));
            }}
            required
            maxLength={160}
          />
        </Field>
        <Field label="Key" htmlFor={`${id}-key`}>
          <Input
            id={`${id}-key`}
            value={key}
            onChange={(e) => {
              setKeyTouched(true);
              setKey(e.target.value);
            }}
            required
            maxLength={80}
            pattern="[a-z0-9_]+"
            title="Lowercase letters, numbers, and underscores"
            autoComplete="off"
            className="font-mono"
          />
        </Field>
      </div>
      <Field label="Description" htmlFor={`${id}-description`}>
        <Textarea
          id={`${id}-description`}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          maxLength={400}
        />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Criteria" htmlFor={`${id}-type`}>
          <select
            id={`${id}-type`}
            className={selectClass}
            value={type}
            onChange={(e) => setType(e.target.value as AchievementCriteriaType)}
          >
            {CRITERIA.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label={meta.thresholdLabel} htmlFor={`${id}-threshold`}>
          <Input
            id={`${id}-threshold`}
            type="number"
            min={1}
            max={1000000}
            value={threshold}
            onChange={(e) => setThreshold(e.target.value)}
            required
          />
        </Field>
      </div>
      {type === "category_solves" ? (
        <Field label="Category" htmlFor={`${id}-category`}>
          <select
            id={`${id}-category`}
            className={selectClass}
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            required
          >
            {categories.length === 0 ? <option value="">No categories</option> : null}
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </Field>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Icon" htmlFor={`${id}-icon`}>
          <Input
            id={`${id}-icon`}
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
            maxLength={60}
            placeholder="trophy"
            autoComplete="off"
          />
        </Field>
        <Field label="XP award" htmlFor={`${id}-points`}>
          <Input
            id={`${id}-points`}
            type="number"
            min={0}
            max={10000}
            value={points}
            onChange={(e) => setPoints(e.target.value)}
            required
          />
        </Field>
        <Field label="Sort order" htmlFor={`${id}-sort`}>
          <Input
            id={`${id}-sort`}
            type="number"
            min={0}
            max={10000}
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            required
          />
        </Field>
      </div>
      <p className="text-xs text-muted">
        XP award of 0 uses the platform default. Lower sort order appears first. The key cannot be
        changed after creation.
      </p>
      <label className="flex items-center gap-2 text-sm text-foreground" htmlFor={`${id}-active`}>
        <input
          id={`${id}-active`}
          type="checkbox"
          className="size-4 accent-accent"
          checked={active}
          onChange={(e) => setActive(e.target.checked)}
        />
        Active (eligible for new awards)
      </label>
      {error ? (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}
      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Creating…" : "Add achievement"}
      </Button>
    </form>
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
      {error ? (
        <p role="alert" className="mb-3 text-sm text-danger">
          {error}
        </p>
      ) : null}
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
  const [title, setTitle] = useState(item.title);
  const [description, setDescription] = useState(item.description);
  const [icon, setIcon] = useState(item.icon ?? "");
  const [type, setType] = useState<AchievementCriteriaType>(item.criteria.type);
  const [threshold, setThreshold] = useState(String(item.criteria.threshold));
  const [categoryId, setCategoryId] = useState(
    item.criteria.category_id ? String(item.criteria.category_id) : categories[0] ? String(categories[0].id) : "",
  );
  const [points, setPoints] = useState(String(item.points));
  const [sortOrder, setSortOrder] = useState(String(item.sort_order));
  const meta = criteriaMeta(type);

  return (
    <form
      className="mt-4 grid max-w-2xl gap-3 border border-border bg-surface p-4"
      aria-label={`Edit ${item.title}`}
      onSubmit={(e) => {
        e.preventDefault();
        onSave({
          title,
          description,
          icon: icon.trim() || null,
          criteria: criteriaPayload(type, threshold, categoryId),
          points: Number(points),
          sort_order: Number(sortOrder),
        });
      }}
    >
      <Field label="Title" htmlFor={`${id}-title`}>
        <Input id={`${id}-title`} value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={160} />
      </Field>
      <Field label="Description" htmlFor={`${id}-description`}>
        <Textarea
          id={`${id}-description`}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          maxLength={400}
        />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Criteria" htmlFor={`${id}-type`}>
          <select
            id={`${id}-type`}
            className={selectClass}
            value={type}
            onChange={(e) => setType(e.target.value as AchievementCriteriaType)}
          >
            {CRITERIA.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label={meta.thresholdLabel} htmlFor={`${id}-threshold`}>
          <Input
            id={`${id}-threshold`}
            type="number"
            min={1}
            max={1000000}
            value={threshold}
            onChange={(e) => setThreshold(e.target.value)}
            required
          />
        </Field>
      </div>
      {type === "category_solves" ? (
        <Field label="Category" htmlFor={`${id}-category`}>
          <select
            id={`${id}-category`}
            className={selectClass}
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            required
          >
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </Field>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Icon" htmlFor={`${id}-icon`}>
          <Input id={`${id}-icon`} value={icon} onChange={(e) => setIcon(e.target.value)} maxLength={60} />
        </Field>
        <Field label="XP award" htmlFor={`${id}-points`}>
          <Input
            id={`${id}-points`}
            type="number"
            min={0}
            max={10000}
            value={points}
            onChange={(e) => setPoints(e.target.value)}
            required
          />
        </Field>
        <Field label="Sort order" htmlFor={`${id}-sort`}>
          <Input
            id={`${id}-sort`}
            type="number"
            min={0}
            max={10000}
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            required
          />
        </Field>
      </div>
      <Button type="submit" size="sm" disabled={disabled} className="w-fit">
        Save changes
      </Button>
    </form>
  );
}
