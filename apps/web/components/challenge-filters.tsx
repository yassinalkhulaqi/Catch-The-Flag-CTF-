"use client";

import { LayoutGrid, List, SlidersHorizontal } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useId, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { SegmentedControl } from "@/components/ui/segmented";
import { DIFFICULTIES, difficultyLabel } from "@/lib/format";
import { TIERS, TIER_LABELS, normalizeTier, type Tier } from "@/lib/tracks";
import { cn } from "@/lib/utils";
import type { Category, Tag } from "@/lib/types";

type TierFilter = Tier | "all";

const selectClass = cn(
  "flex h-10 w-full rounded-md border border-border bg-background/70 px-3 text-sm text-foreground shadow-sm",
  "transition-[border-color,box-shadow,background-color] duration-200 hover:border-border-strong",
  "focus-visible:border-accent focus-visible:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
);

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
    const next = new URLSearchParams();
    for (const key of ["q", "category", "difficulty", "tags", "solved", "sort", "min_points", "max_points"]) {
      const v = String(data.get(key) ?? "").trim();
      if (v) next.set(key, v);
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
      <form
        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5"
        onSubmit={(e) => {
          e.preventDefault();
          apply(e.currentTarget);
        }}
        aria-label="Filter challenges"
        aria-busy={pending}
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
          className={selectClass}
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
          className={selectClass}
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
          className={selectClass}
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
          className={selectClass}
        >
          <option value="">Any</option>
          <option value="true">Solved</option>
          <option value="false">Unsolved</option>
        </select>
      </Field>

      <Field label="Min points" htmlFor={`${id}-min`}>
        <Input id={`${id}-min`} name="min_points" inputMode="numeric" defaultValue={params.get("min_points") ?? ""} />
      </Field>
      <Field label="Max points" htmlFor={`${id}-max`}>
        <Input id={`${id}-max`} name="max_points" inputMode="numeric" defaultValue={params.get("max_points") ?? ""} />
      </Field>
      <Field label="Sort" htmlFor={`${id}-sort`}>
        <select
          id={`${id}-sort`}
          name="sort"
          defaultValue={params.get("sort") ?? ""}
          className={selectClass}
        >
          <option value="">Default</option>
          <option value="-points">Points, high to low</option>
          <option value="points">Points, low to high</option>
          <option value="-created_at">Newest</option>
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
      </form>
    </div>
  );
}
