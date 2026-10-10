"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface DataColumn<T> {
  id: string;
  header: string;
  cell: (row: T) => React.ReactNode;
  sortValue?: (row: T) => string | number;
}

export interface BulkAction<T> {
  id: string;
  label: string;
  /** Called once per selected row. There is no bulk endpoint. */
  run: (row: T) => Promise<void>;
}

export function DataTable<T extends { id: string | number }>({
  rows,
  columns,
  caption,
  searchText,
  rowLabel,
  bulkActions,
  empty = "Nothing matches these filters.",
}: {
  rows: T[];
  columns: DataColumn<T>[];
  caption: string;
  searchText: (row: T) => string;
  rowLabel: (row: T) => string;
  bulkActions?: BulkAction<T>[];
  empty?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const query = params.get("q") ?? "";
  const sort = params.get("sort") ?? "";
  const hidden = new Set((params.get("cols") ?? "").split(",").filter(Boolean));
  const [selected, setSelected] = useState<Array<T["id"]>>([]);
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const visibleColumns = columns.filter((column) => !hidden.has(column.id));

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const matched = needle
      ? rows.filter((row) => searchText(row).toLowerCase().includes(needle))
      : rows;
    if (!sort) return matched;
    const desc = sort.startsWith("-");
    const key = desc ? sort.slice(1) : sort;
    const column = columns.find((item) => item.id === key);
    if (!column?.sortValue) return matched;
    return [...matched].sort((a, b) => {
      const left = column.sortValue?.(a);
      const right = column.sortValue?.(b);
      const order = String(left).localeCompare(String(right), undefined, { numeric: true });
      return desc ? -order : order;
    });
  }, [columns, query, rows, searchText, sort]);

  function write(mutate: (next: URLSearchParams) => void) {
    const next = new URLSearchParams(params.toString());
    mutate(next);
    const value = next.toString();
    router.replace(value ? `${pathname}?${value}` : pathname, { scroll: false });
  }

  function toggleSort(id: string) {
    write((next) => {
      const current = next.get("sort");
      if (current === id) next.set("sort", `-${id}`);
      else if (current === `-${id}`) next.delete("sort");
      else next.set("sort", id);
    });
  }

  function toggleColumn(id: string) {
    write((next) => {
      const set = new Set((next.get("cols") ?? "").split(",").filter(Boolean));
      if (set.has(id)) set.delete(id);
      else set.add(id);
      if (set.size === 0) next.delete("cols");
      else next.set("cols", [...set].join(","));
    });
  }

  const allVisibleSelected =
    filtered.length > 0 && filtered.every((row) => selected.includes(row.id));

  async function runBulk(action: BulkAction<T>) {
    const chosen = filtered.filter((row) => selected.includes(row.id));
    if (chosen.length === 0) return;
    if (!window.confirm(`${action.label} for ${chosen.length} row(s)? Each row is a separate request.`)) return;
    setPending(true);
    setNotice(null);
    try {
      for (const row of chosen) await action.run(row);
      setSelected([]);
      setNotice(`${action.label} finished for ${chosen.length} row(s).`);
      router.refresh();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Bulk action failed.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-3">
        <label className="min-w-48 flex-1 text-sm">
          <span className="mb-1 block font-medium">Filter loaded rows</span>
          <Input
            value={query}
            onChange={(event) =>
              write((next) => {
                const value = event.target.value;
                if (value) next.set("q", value);
                else next.delete("q");
              })
            }
            placeholder="Search this page"
          />
        </label>
        <fieldset className="text-sm">
          <legend className="mb-1 font-medium">Columns</legend>
          <div className="flex flex-wrap gap-3">
            {columns.map((column) => (
              <label key={column.id} className="inline-flex items-center gap-1.5">
                <input
                  type="checkbox"
                  checked={!hidden.has(column.id)}
                  onChange={() => toggleColumn(column.id)}
                />
                {column.header}
              </label>
            ))}
          </div>
        </fieldset>
      </div>

      {bulkActions && bulkActions.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          {bulkActions.map((action) => (
            <Button
              key={action.id}
              type="button"
              size="sm"
              variant="outline"
              disabled={pending || selected.length === 0}
              onClick={() => runBulk(action)}
            >
              {action.label}
            </Button>
          ))}
          <span className="text-xs text-muted">{selected.length} selected</span>
        </div>
      ) : null}
      {notice ? (
        <p role="status" className="text-sm text-muted">
          {notice}
        </p>
      ) : null}

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[40rem] border-collapse text-start text-sm">
          <caption className="sr-only">{caption}</caption>
          <thead className="bg-surface text-muted">
            <tr>
              <th className="px-3 py-2">
                <input
                  type="checkbox"
                  aria-label="Select all visible rows"
                  checked={allVisibleSelected}
                  onChange={() =>
                    setSelected(allVisibleSelected ? [] : filtered.map((row) => row.id))
                  }
                />
              </th>
              {visibleColumns.map((column) => {
                const active = sort === column.id || sort === `-${column.id}`;
                const direction = sort === `-${column.id}` ? "descending" : sort === column.id ? "ascending" : "none";
                return (
                  <th key={column.id} aria-sort={column.sortValue ? direction : undefined} className="px-3 py-2 text-start">
                    {column.sortValue ? (
                      <button type="button" className="font-mono text-[11px] uppercase tracking-wide" onClick={() => toggleSort(column.id)}>
                        {column.header}
                        {active ? (direction === "descending" ? " ↓" : " ↑") : ""}
                      </button>
                    ) : (
                      <span className="font-mono text-[11px] uppercase tracking-wide">{column.header}</span>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={visibleColumns.length + 1} className="px-3 py-8 text-muted">
                  {empty}
                </td>
              </tr>
            ) : (
              filtered.map((row) => (
                <tr key={row.id} className={cn("border-t border-border", selected.includes(row.id) && "bg-accent/5")}>
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      aria-label={`Select ${rowLabel(row)}`}
                      checked={selected.includes(row.id)}
                      onChange={() =>
                        setSelected((current) =>
                          current.includes(row.id) ? current.filter((id) => id !== row.id) : [...current, row.id],
                        )
                      }
                    />
                  </td>
                  {visibleColumns.map((column) => (
                    <td key={column.id} className="px-3 py-2 align-middle">
                      {column.cell(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-faint">
        Showing {filtered.length} of {rows.length} loaded rows. Filters and sort are saved in the URL.
      </p>
    </div>
  );
}
