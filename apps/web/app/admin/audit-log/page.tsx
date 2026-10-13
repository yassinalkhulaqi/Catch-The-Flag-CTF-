import type { Metadata } from "next";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { listAdminAuditLogsServer } from "@/lib/api/admin-server";

export const metadata: Metadata = { title: "Admin · Audit log" };

function text(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "string") return value || "—";
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    const parts: string[] = [];
    if (typeof record.name === "string") parts.push(record.name);
    else if (typeof record.email === "string") parts.push(record.email);
    const type = record.type ?? record.auditable_type;
    const id = record.id ?? record.auditable_id;
    if (typeof type === "string") parts.push(parts.length ? `(${type}${typeof id === "number" || typeof id === "string" ? ` #${id}` : ""})` : `${type}${typeof id === "number" || typeof id === "string" ? ` #${id}` : ""}`);
    else if (typeof id === "number" || typeof id === "string") parts.push(`#${id}`);
    if (parts.length > 0) return parts.join(" ");
    try {
      const json = JSON.stringify(value);
      return json.length > 80 ? `${json.slice(0, 80)}…` : json;
    } catch {
      return "—";
    }
  }
  return "—";
}

function formatTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Read-only audit trail with server-side action filter. */
export default async function AdminAuditLogPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string }>;
}) {
  const params = await searchParams;
  const action = params.action?.trim() || undefined;
  const { items, total } = await listAdminAuditLogsServer({
    action,
    per_page: 100,
  });

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
        Audit log
      </h1>
      <p className="mt-1 text-sm text-muted">
        {total} {total === 1 ? "entry" : "entries"}
        {action ? ` matching action “${action}”` : ""}. Read-only — entries
        are written by the backend on every admin mutation.
      </p>

      <form method="get" action="/admin/audit-log" className="mt-4 flex max-w-md gap-2" role="search" aria-label="Filter audit log by action">
        <label htmlFor="audit-action" className="sr-only">
          Filter by action
        </label>
        <input
          id="audit-action"
          name="action"
          type="search"
          defaultValue={action ?? ""}
          placeholder="Filter by action, e.g. challenge.published…"
          className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-sm text-foreground placeholder:text-faint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
        />
        <button
          type="submit"
          className="inline-flex h-10 cursor-pointer items-center rounded-md border border-border bg-surface-raised px-4 text-sm text-foreground hover:bg-border"
        >
          Filter
        </button>
      </form>

      {items.length === 0 ? (
        <Card className="mt-4">
          <CardTitle>No audit entries</CardTitle>
          <CardDescription className="mt-2">
            {action
              ? "Nothing matches this action filter — try clearing it."
              : "The backend may be unreachable, or no admin actions have been recorded yet."}
          </CardDescription>
        </Card>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-raised text-xs uppercase tracking-wide text-muted">
                <th scope="col" className="px-4 py-2.5 font-medium">Time</th>
                <th scope="col" className="px-4 py-2.5 font-medium">Actor</th>
                <th scope="col" className="px-4 py-2.5 font-medium">Action</th>
                <th scope="col" className="px-4 py-2.5 font-medium">Target</th>
                <th scope="col" className="px-4 py-2.5 font-medium">Changes</th>
              </tr>
            </thead>
            <tbody>
              {items.map((entry, i) => (
                <tr
                  key={`${entry.id}-${i}`}
                  className="border-b border-border bg-surface align-top last:border-b-0"
                >
                  <td className="px-4 py-2.5 whitespace-nowrap text-muted">
                    {formatTime(entry.created_at)}
                  </td>
                  <td className="px-4 py-2.5 text-foreground">
                    {text(entry.actor)}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-xs text-accent">
                    {entry.action}
                  </td>
                  <td className="px-4 py-2.5 text-muted">
                    {text(entry.auditable)}
                  </td>
                  <td className="max-w-64 px-4 py-2.5 font-mono text-xs text-faint">
                    <span className="block truncate" title={text(entry.changes)}>
                      {text(entry.changes)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
