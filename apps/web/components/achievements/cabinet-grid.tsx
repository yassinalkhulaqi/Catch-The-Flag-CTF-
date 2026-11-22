"use client";

import { useCallback, useId, useMemo, useState } from "react";
import { RotateCcw, Search, SearchX, X } from "lucide-react";
import { AchievementDetail } from "@/components/achievements/achievement-detail";
import { TrophyTile } from "@/components/achievements/trophy-tile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SegmentedControl } from "@/components/ui/segmented";
import { Select } from "@/components/ui/select";
import {
  type CabinetFilter,
  type CabinetSort,
  filterCabinet,
  searchCabinet,
  sortCabinet,
} from "@/lib/achievements/cabinet";
import type { Dictionary } from "@/lib/i18n/en";
import type { Achievement } from "@/lib/types";

export function CabinetGrid({
  items,
  copy,
}: {
  items: Achievement[];
  copy: Dictionary["achievements"];
}) {
  const searchId = useId();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<CabinetFilter>("all");
  const [sort, setSort] = useState<CabinetSort>("default");
  const [selected, setSelected] = useState<Achievement | null>(null);

  const closeDetail = useCallback(() => setSelected(null), []);

  const visible = useMemo(() => {
    const scoped = filterCabinet(items, filter);
    const matched = searchCabinet(scoped, query);
    return sortCabinet(matched, sort);
  }, [items, filter, query, sort]);

  const dirty = query.trim() !== "" || filter !== "all" || sort !== "default";

  function reset() {
    setQuery("");
    setFilter("all");
    setSort("default");
  }

  const filterOptions = [
    { value: "all", label: copy.filterAll },
    { value: "unlocked", label: copy.unlocked },
    { value: "progress", label: copy.filterProgress },
    { value: "locked", label: copy.locked },
  ] as const;

  const sortOptions = [
    { value: "default", label: copy.sortDefault },
    { value: "closest", label: copy.sortClosest },
    { value: "recent", label: copy.sortRecent },
    { value: "alpha", label: copy.sortAlpha },
  ];

  return (
    <section aria-label={copy.title} className="mt-6">
      <div className="rounded-2xl border border-border bg-surface/40 p-3 sm:p-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="min-w-0 flex-1 sm:w-64">
              <label
                htmlFor={searchId}
                className="mb-1 block font-mono text-[10px] uppercase tracking-wide text-faint"
              >
                {copy.search}
              </label>
              <div className="relative">
                <Search
                  aria-hidden="true"
                  className="pointer-events-none absolute start-3 top-1/2 size-3.5 -translate-y-1/2 text-faint"
                />
                <Input
                  id={searchId}
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={copy.searchPlaceholder}
                  className="h-9 ps-9 pe-9"
                  autoComplete="off"
                />
                {query ? (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    aria-label={copy.clearSearch}
                    className="absolute end-2 top-1/2 inline-flex size-6 -translate-y-1/2 items-center justify-center rounded-sm text-faint transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
                  >
                    <X aria-hidden="true" className="size-3.5" />
                  </button>
                ) : null}
              </div>
            </div>

            <div>
              <span className="mb-1 block font-mono text-[10px] uppercase tracking-wide text-faint">
                {copy.filter}
              </span>
              <SegmentedControl
                label={copy.filter}
                options={filterOptions}
                value={filter}
                onChange={setFilter}
              />
            </div>

            <div className="sm:w-44">
              <span className="mb-1 block font-mono text-[10px] uppercase tracking-wide text-faint">
                {copy.sort}
              </span>
              <Select
                label={copy.sort}
                value={sort}
                options={sortOptions}
                onValueChange={(next) => setSort(next as CabinetSort)}
              />
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 sm:justify-end">
            <p
              aria-live="polite"
              className="font-mono text-[11px] uppercase tracking-wide text-faint"
            >
              <span className="text-foreground">{visible.length}</span> {copy.showing}
            </p>
            {dirty ? (
              <Button variant="ghost" size="sm" onClick={reset}>
                <RotateCcw aria-hidden="true" className="size-3.5" />
                {copy.reset}
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      {visible.length === 0 ? (
        <div
          role="status"
          className="mt-3 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-surface/30 px-6 py-12 text-center"
        >
          <span className="inline-flex size-10 items-center justify-center rounded-full border border-border bg-surface-raised">
            <SearchX aria-hidden="true" className="size-4 text-faint" />
          </span>
          <div>
            <p className="font-medium text-foreground">{copy.filterEmpty}</p>
            <p className="mt-1 text-sm text-muted">{copy.filterEmptyBody}</p>
          </div>
          <Button variant="outline" size="sm" onClick={reset}>
            <RotateCcw aria-hidden="true" className="size-3.5" />
            {copy.reset}
          </Button>
        </div>
      ) : (
        <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((achievement) => (
            <TrophyTile
              key={achievement.id}
              achievement={achievement}
              copy={copy}
              onOpen={setSelected}
            />
          ))}
        </ul>
      )}

      <AchievementDetail
        achievement={selected}
        copy={copy}
        onClose={closeDetail}
      />
    </section>
  );
}
