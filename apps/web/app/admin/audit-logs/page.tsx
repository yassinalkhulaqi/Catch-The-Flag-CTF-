import { EmptyState, ErrorState, PageHeader } from "@/components/empty-state";
import { requireStaff } from "@/lib/auth";
import { serverApi } from "@/lib/api/server";
import { timeAgo } from "@/lib/utils";
import type { AuditLogEntry, Paginated } from "@/lib/types";

export const metadata = { title: "Admin · Audit logs" };

export default async function AdminAuditLogsPage() {
  await requireStaff();

  let logs: AuditLogEntry[] = [];
  let loadError = false;
  try {
    const res = await serverApi<Paginated<AuditLogEntry>>(
      "GET",
      "/admin/audit-logs?per_page=50",
    );
    logs = res.data;
  } catch {
    loadError = true;
  }

  return (
    <div>
      <PageHeader
        eyebrow="Operations"
        title="Audit logs"
        description="Admin mutations with redacted diffs."
      />
      {loadError ? (
        <ErrorState />
      ) : logs.length === 0 ? (
        <EmptyState title="No audit events yet" />
      ) : (
        <ul className="divide-y divide-border border-t border-border">
          {logs.map((log) => (
            <li key={log.id} className="py-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-mono text-accent">{log.action}</p>
                <p className="font-mono text-xs text-faint">{timeAgo(log.created_at)}</p>
              </div>
              <p className="mt-1 text-muted">
                {log.actor?.name ?? `actor #${log.actor_id ?? "—"}`}
                {log.auditable_type ? (
                  <>
                    {" "}
                    · {log.auditable_type}
                    {log.auditable_id != null ? `#${log.auditable_id}` : ""}
                  </>
                ) : null}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
