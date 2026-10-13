"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Input, Label } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { Category } from "@/lib/types";

const DIFFICULTIES = ["beginner", "intermediate", "advanced", "expert"] as const;

const selectClass = cn(
  "flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm",
  "text-foreground",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60",
  "disabled:cursor-not-allowed disabled:opacity-50",
);

type CategoryOption = Pick<Category, "id" | "name" | "slug">;

/**
 * Challenge/path filter bar. Syncs search + category/difficulty selects +
 * solved toggle into URL query params so Server Components can filter
 * server-side. Text input is debounced; selects apply immediately.
 */
export function SearchFilterBar({
  categories = [],
  showSolved = true,
}: {
  categories?: CategoryOption[];
  showSolved?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState(searchParams.get("q") ?? "");

  const update = useCallback(
    (patch: Record<string, string | null>) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(patch)) {
        if (value === null || value === "") next.delete(key);
        else next.set(key, value);
      }
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname);
    },
    [pathname, router, searchParams],
  );

  // Debounced free-text search → `q` param.
  useEffect(() => {
    if (query === (searchParams.get("q") ?? "")) return;
    const timer = setTimeout(() => update({ q: query || null }), 300);
    return () => clearTimeout(timer);
  }, [query, searchParams, update]);

  const category = searchParams.get("category") ?? "all";
  const difficulty = searchParams.get("difficulty") ?? "all";
  const solvedOnly = searchParams.get("solved") === "true";

  return (
    <div
      aria-label="Filter challenges"
      className="grid gap-3 rounded-lg border border-border bg-surface p-4 sm:grid-cols-2 lg:grid-cols-4"
    >
      <div className="space-y-1.5">
        <Label htmlFor="filter-search">Search</Label>
        <Input
          id="filter-search"
          type="search"
          placeholder="Search by keyword…"
          autoComplete="off"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="filter-category">Category</Label>
        <select
          id="filter-category"
          className={selectClass}
          value={category}
          onChange={(e) =>
            update({
              category: e.target.value === "all" ? null : e.target.value,
            })
          }
        >
          <option value="all">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="filter-difficulty">Difficulty</Label>
        <select
          id="filter-difficulty"
          className={selectClass}
          value={difficulty}
          onChange={(e) =>
            update({
              difficulty: e.target.value === "all" ? null : e.target.value,
            })
          }
        >
          <option value="all">All difficulties</option>
          {DIFFICULTIES.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>

      {showSolved ? (
        <div className="flex items-end pb-2">
          <div className="flex items-center gap-2">
            <input
              id="filter-solved"
              type="checkbox"
              className="h-4 w-4 accent-[var(--accent)]"
              checked={solvedOnly}
              onChange={(e) => update({ solved: e.target.checked ? "true" : null })}
            />
            <Label htmlFor="filter-solved">Solved only</Label>
          </div>
        </div>
      ) : null}
    </div>
  );
}
