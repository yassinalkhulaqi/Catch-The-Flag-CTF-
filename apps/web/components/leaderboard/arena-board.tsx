"use client";

import { useId, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  RotateCcw,
  Search,
  SearchX,
  X,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SegmentedControl } from "@/components/ui/segmented";
import {
  type ArenaDirection,
  type ArenaScope,
  type ArenaSort,
  scopeBoard,
  searchBoard,
  sortBoard,
  xpPerSolve,
} from "@/lib/leaderboard/arena";
import type { Dictionary } from "@/lib/i18n/en";
import { cn, formatXp } from "@/lib/utils";
import type { LeaderboardEntry } from "@/lib/types";

function SortHeader({
  sort,
  label,
  activeSort,
  direction,
  onSort,
  className,
}: {
  sort: ArenaSort;
  label: string;
  activeSort: ArenaSort;
  direction: ArenaDirection;
  onSort: (next: ArenaSort) => void;
  className?: string;
}) {
  const active = sort === activeSort;
  const Icon = active ? (direction === "desc" ? ArrowDown : ArrowUp) : ArrowUpDown;

  return (
    <th
      scope="col"
      aria-sort={active ? (direction === "desc" ? "descending" : "ascending") : "none"}
      className={cn("px-4 py-3 text-right", className)}
    >
      <button
        type="button"
        onClick={() => onSort(sort)}
        className={cn(
          "group inline-flex items-center justify-end gap-1 rounded-sm font-mono text-[11px] uppercase tracking-wide transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60",
          active ? "text-accent" : "text-muted hover:text-foreground",
        )}
      >
        {label}
        <Icon
          aria-hidden="true"
          className={cn("size-3", active ? "opacity-100" : "opacity-40 group-hover:opacity-80")}
        />
      </button>
    </th>
  );
}

export function ArenaBoard({
  entries,
  viewerId,
  copy,
}: {
  entries: LeaderboardEntry[];
  viewerId?: number;
  copy: Dictionary["arena"];
}) {
  const searchId = useId();
  const [query, setQuery] = useState("");
  const [scope, setScope] = useState<ArenaScope>("all");
  const [sort, setSort] = useState<ArenaSort>("xp");
  const [direction, setDirection] = useState<ArenaDirection>("desc");

  const viewerLoaded = viewerId !== undefined && entries.some((row) => row.id === viewerId);
  const aroundUnavailable = scope === "around" && !viewerLoaded;

  const scoped = useMemo(
    () => scopeBoard(entries, scope, viewerId),
    [entries, scope, viewerId],
  );
  const matched = useMemo(() => searchBoard(scoped, query), [scoped, query]);
  const visible = useMemo(
    () => sortBoard(matched, sort, direction),
    [matched, sort, direction],
  );

  const dirty = query.trim() !== "" || scope !== "all" || sort !== "xp" || direction !== "desc";

  function handleSort(next: ArenaSort) {
    if (next === sort) {
      setDirection((current) => (current === "desc" ? "asc" : "desc"));
      return;
    }
    setSort(next);
    setDirection("desc");
  }

  function reset() {
    setQuery("");
    setScope("all");
    setSort("xp");
    setDirection("desc");
  }

  const scopeOptions = [
    { value: "all", label: copy.scopeAll },
    { value: "top", label: copy.scopeTop },
    { value: "around", label: copy.scopeAround },
  ] as const;

  const sortOptions = [
    { value: "xp", label: copy.sortXp },
    { value: "solves", label: copy.sortSolves },
    { value: "achievements", label: copy.sortBadges },
  ] as const;

  return (
    <section aria-labelledby="arena-board-title" className="min-w-0">
      <h2 id="arena-board-title" className="sr-only">
        {copy.title}
      </h2>

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
                {copy.scope}
              </span>
              <SegmentedControl
                label={copy.scope}
                options={scopeOptions}
                value={scope}
                onChange={setScope}
              />
            </div>

            <div className="md:hidden">
              <span className="mb-1 block font-mono text-[10px] uppercase tracking-wide text-faint">
                {copy.sort}
              </span>
              <SegmentedControl
                label={copy.sort}
                options={sortOptions}
                value={sort}
                onChange={(next) => {
                  setSort(next);
                  setDirection("desc");
                }}
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

        {aroundUnavailable ? (
          <p
            role="status"
            className="mt-3 rounded-md border border-warning/30 bg-warning/[0.06] px-2.5 py-1.5 text-xs text-warning"
          >
            {copy.scopeAroundUnavailable}
          </p>
        ) : null}
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
            <p className="font-medium text-foreground">{copy.empty}</p>
            <p className="mt-1 text-sm text-muted">{copy.emptyBody}</p>
          </div>
          <Button variant="outline" size="sm" onClick={reset}>
            <RotateCcw aria-hidden="true" className="size-3.5" />
            {copy.reset}
          </Button>
        </div>
      ) : (
        <div className="mt-3 overflow-hidden rounded-2xl border border-border bg-surface/30">
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[720px] text-left text-sm">
              <caption className="sr-only">
                {copy.title} — {copy.rank} is assigned by the server; column sorting only
                changes the display order.
              </caption>
              <thead className="border-b border-border bg-surface">
                <tr>
                  <th
                    scope="col"
                    className="px-4 py-3 font-mono text-[11px] uppercase tracking-wide text-muted"
                  >
                    {copy.rank}
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 font-mono text-[11px] uppercase tracking-wide text-muted"
                  >
                    {copy.player}
                  </th>
                  <SortHeader
                    sort="xp"
                    label={copy.xp}
                    activeSort={sort}
                    direction={direction}
                    onSort={handleSort}
                  />
                  <SortHeader
                    sort="solves"
                    label={copy.solves}
                    activeSort={sort}
                    direction={direction}
                    onSort={handleSort}
                  />
                  <SortHeader
                    sort="achievements"
                    label={copy.badges}
                    activeSort={sort}
                    direction={direction}
                    onSort={handleSort}
                  />
                  <th
                    scope="col"
                    className="px-4 py-3 text-right font-mono text-[11px] uppercase tracking-wide text-muted"
                  >
                    {copy.efficiency}
                  </th>
                </tr>
              </thead>
              <tbody>
                {visible.map((row) => {
                  const isMe = viewerId === row.id;
                  return (
                    <tr
                      key={row.id}
                      className={cn(
                        "border-b border-border/70 transition-colors last:border-0 hover:bg-surface/60",
                        isMe && "bg-accent/[0.06]",
                      )}
                    >
                      <td className="px-4 py-2.5">
                        <span
                          className={cn(
                            "inline-flex min-w-8 justify-center rounded-md px-1.5 py-0.5 font-mono text-xs tabular-nums",
                            row.rank <= 3 ? "bg-accent/10 text-accent" : "text-muted",
                          )}
                        >
                          #{row.rank}
                        </span>
                      </td>
                      <th scope="row" className="px-4 py-2.5 font-normal">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={row.name} className="size-8 text-[10px]" />
                          <span className="truncate font-medium text-foreground">
                            {row.name}
                          </span>
                          {isMe ? (
                            <Badge tone="accent" className="shrink-0">
                              {copy.you}
                            </Badge>
                          ) : null}
                        </div>
                      </th>
                      <td className="px-4 py-2.5 text-right font-mono tabular-nums">
                        {formatXp(row.xp)}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono tabular-nums">
                        {formatXp(row.solved_count)}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono tabular-nums">
                        {formatXp(row.achievements_count)}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono text-xs tabular-nums text-muted">
                        {formatXp(xpPerSolve(row))}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <ul className="divide-y divide-border md:hidden">
            {visible.map((row) => {
              const isMe = viewerId === row.id;
              return (
                <li
                  key={row.id}
                  className={cn("p-3.5", isMe && "bg-accent/[0.06]")}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={cn(
                        "inline-flex min-w-8 shrink-0 justify-center rounded-md px-1.5 py-0.5 font-mono text-xs tabular-nums",
                        row.rank <= 3 ? "bg-accent/10 text-accent" : "text-muted",
                      )}
                    >
                      #{row.rank}
                    </span>
                    <Avatar name={row.name} className="size-8 text-[10px]" />
                    <span className="min-w-0 flex-1 truncate font-medium text-foreground">
                      {row.name}
                    </span>
                    {isMe ? <Badge tone="accent">{copy.you}</Badge> : null}
                  </div>
                  <dl className="mt-2.5 grid grid-cols-4 gap-2 ps-10 text-[11px]">
                    <div>
                      <dt className="font-mono text-[9px] uppercase tracking-wide text-faint">
                        {copy.xp}
                      </dt>
                      <dd className="font-mono tabular-nums text-foreground">
                        {formatXp(row.xp)}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-mono text-[9px] uppercase tracking-wide text-faint">
                        {copy.solves}
                      </dt>
                      <dd className="font-mono tabular-nums text-foreground">
                        {formatXp(row.solved_count)}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-mono text-[9px] uppercase tracking-wide text-faint">
                        {copy.badges}
                      </dt>
                      <dd className="font-mono tabular-nums text-foreground">
                        {formatXp(row.achievements_count)}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-mono text-[9px] uppercase tracking-wide text-faint">
                        {copy.efficiency}
                      </dt>
                      <dd className="font-mono tabular-nums text-muted">
                        {formatXp(xpPerSolve(row))}
                      </dd>
                    </div>
                  </dl>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
}
