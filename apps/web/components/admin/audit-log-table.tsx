"use client";

import { useState } from "react";
import { timeAgo } from "@/lib/utils";
import type { AuditLogEntry } from "@/lib/types";

export function AuditLogTable({ rows }: { rows: AuditLogEntry[] }) {
  const [open, setOpen] = useState<number | null>(null);

  if (rows.length === 0) return null;

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full min-w-[40rem] border-collapse text-start text-sm">
        <caption className="sr-only">Audit log</caption>
        <thead className="bg-surface text-muted">
          <tr>
            <th className="px-3 py-2 text-start font-mono text-[11px] uppercase">When</th>
            <th className="px-3 py-2 text-start font-mono text-[11px] uppercase">Action</th>
            <th className="px-3 py-2 text-start font-mono text-[11px] uppercase">Actor</th>
            <th className="px-3 py-2 text-start font-mono text-[11px] uppercase">Entity</th>
            <th className="px-3 py-2 text-start font-mono text-[11px] uppercase">Diff</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const expanded = open === row.id;
            return (
              <tr key={row.id} className="border-t border-border align-top">
                <td className="px-3 py-2 font-mono text-xs text-faint">
                  <time dateTime={row.created_at}>{timeAgo(row.created_at)}</time>
                </td>
                <td className="px-3 py-2 font-mono text-accent">{row.action}</td>
                <td className="px-3 py-2">{row.actor?.name ?? (row.actor_id != null ? `#${row.actor_id}` : "—")}</td>
                <td className="px-3 py-2 text-muted">
                  {row.auditable_type ?? "—"}
                  {row.auditable_id != null ? ` #${row.auditable_id}` : ""}
                </td>
                <td className="px-3 py-2">
                  <button
                    type="button"
                    aria-expanded={expanded}
                    className="text-sm text-accent hover:underline"
                    onClick={() => setOpen(expanded ? null : row.id)}
                  >
                    {expanded ? "Hide diff" : "Show diff"}
                  </button>
                  {expanded ? (
                    <pre className="mt-2 max-w-xl overflow-x-auto rounded-md bg-surface-raised p-3 font-mono text-xs text-foreground">
                      {JSON.stringify(row.changes ?? {}, null, 2)}
                    </pre>
                  ) : null}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
