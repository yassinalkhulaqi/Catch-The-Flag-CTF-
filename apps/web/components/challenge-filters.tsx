"use client";

import { LayoutGrid, List, SlidersHorizontal } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useId, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Form, FormError, SelectField } from "@/components/ui/form";
import { Field, Input } from "@/components/ui/input";
import { SegmentedControl } from "@/components/ui/segmented";
import { DIFFICULTIES, difficultyLabel } from "@/lib/format";
import { challengeFiltersSchema } from "@/lib/schemas/filters";
import { TIERS, TIER_LABELS, normalizeTier, type Tier } from "@/lib/tracks";
import type { Category, Tag } from "@/lib/types";

type TierFilter = Tier | "all";

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
  const [error, setError] = useState<string | null>(null);

  const view = params.get("view") === "grid" ? "grid" : "list";
  const activeTier: Tier | null = normalizeTier(params.get("tier"));

  function setTier(next: Tier | null) {
    const query = new URLSearchParams(params.toString());
    if (next === null) query.delete("tier");
    else query.set("tier", next);
    query.delete("page");
    startTransition(() => router.push(`/challenges${query.toString() ? `?${query}` : ""}`));
  }

  function setView(next: "list" | "grid") {
    const query = new URLSearchParams(params.toString());
    if (next === "list") query.delete("view");
    else query.set("view", next);
    startTransition(() => router.push(`/challenges${query.toString() ? `?${query}` : ""}`));
  }

  function apply(form: HTMLFormElement) {
    const data = new FormData(form);
    const raw: Record<string, string | string[]> = {};
    for (const key of ["q", "category", "difficulty", "tags", "solved", "sort", "min_points", "max_points"]) {
      const value = String(data.get(key) ?? "").trim();
      if (value) raw[key] = key === "tags" ? [value] : value;
    }

    const parsed = challengeFiltersSchema.safeParse(raw);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check the filters and try again.");
      return;
    }
    setError(null);

    const next = new URLSearchParams();
    for (const [key, value] of Object.entries(raw)) {
      next.set(key, Array.isArray(value) ? value.join(",") : value);
    }
    // Preserve the presentation-only tier + layout params across submits.
    if (activeTier) next.set("tier", activeTier);
    if (view === "grid") next.set("view", view);
    startTransition(() => {
      router.push(`/challenges${next.toString() ? `?${next}` : ""}`);
    });
  }

  const tierOptions: { value: TierFilter; label: string }[] = [
    { value: "all", label: "All" },
    ...TIERS.map((tier) => ({ value: tier, label: TIER_LABELS[tier] })),
  ];

  return (
    <div className="space-y-3 rounded-2xl border border-border bg-surface/60 p-3 shadow-sm sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-faint">
          <SlidersHorizontal aria-hidden="true" className="size-3.5 text-accent" />
          Refine the catalog
        </p>
        <SegmentedControl<TierFilter>
          label="Tier"
          options={tierOptions}
          value={activeTier ?? "all"}
          onChange={(next) => setTier(next === "all" ? null : next)}
        />
      </div>
      <Form
        label="Filter challenges"
        pending={pending}
        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5"
        onSubmit={(event) => {
          event.preventDefault();
          apply(event.currentTarget);
        }}
      >
        <div className="space-y-1.5 lg:col-span-2">
          <FormError>{error}</FormError>
          <Input
            id={`${id}-q`}
            name="q"
            aria-label="Search"
            placeholder="Memory dump, strings…"
            defaultValue={params.get("q") ?? ""}
          />
        </div>

        <SelectField
          id={`${id}-category`}
          name="category"
          label="Category"
          defaultValue={params.get("category") ?? ""}
          options={[
            { value: "", label: "All" },
            ...categories.map((c) => ({ value: c.slug, label: c.name })),
          ]}
        />

        <SelectField
          id={`${id}-difficulty`}
          name="difficulty"
          label="Difficulty"
          defaultValue={params.get("difficulty") ?? ""}
          options={[
            { value: "", label: "All" },
            ...DIFFICULTIES.map((d) => ({ value: d, label: difficultyLabel(d) })),
          ]}
        />

        <SelectField
          id={`${id}-tags`}
          name="tags"
          label="Tag"
          defaultValue={params.get("tags") ?? ""}
          options={[
            { value: "", label: "All" },
            ...tags.map((t) => ({ value: t.slug, label: t.name })),
          ]}
        />

        <SelectField
          id={`${id}-solved`}
          name="solved"
          label="Solved"
          defaultValue={params.get("solved") ?? ""}
          options={[
            { value: "", label: "Any" },
            { value: "true", label: "Solved" },
            { value: "false", label: "Unsolved" },
          ]}
        />

        <Field label="Min points" htmlFor={`${id}-min`}>
          <Input id={`${id}-min`} name="min_points" inputMode="numeric" defaultValue={params.get("min_points") ?? ""} />
        </Field>
        <Field label="Max points" htmlFor={`${id}-max`}>
          <Input id={`${id}-max`} name="max_points" inputMode="numeric" defaultValue={params.get("max_points") ?? ""} />
        </Field>

        <SelectField
          id={`${id}-sort`}
          name="sort"
          label="Sort"
          defaultValue={params.get("sort") ?? ""}
          options={[
            { value: "", label: "Default" },
            { value: "-points", label: "Points, high to low" },
            { value: "points", label: "Points, low to high" },
            { value: "-created_at", label: "Newest" },
          ]}
        />

        <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-5">
          <Button type="submit" loading={pending}>
            Apply filters
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => startTransition(() => router.push("/challenges"))}
          >
            Clear
          </Button>
          <SegmentedControl<"list" | "grid">
            label="Layout"
            className="ms-auto"
            options={[
              {
                value: "list",
                label: (
                  <>
                    <List aria-hidden="true" className="size-3.5" />
                    List
                  </>
                ),
              },
              {
                value: "grid",
                label: (
                  <>
                    <LayoutGrid aria-hidden="true" className="size-3.5" />
                    Grid
                  </>
                ),
              },
            ]}
            value={view}
            onChange={(next) => setView(next)}
          />
        </div>
      </Form>
    </div>
  );
}
