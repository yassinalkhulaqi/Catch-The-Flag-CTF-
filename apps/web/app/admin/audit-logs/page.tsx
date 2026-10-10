import { AuditFilters } from "@/components/admin/audit-filters";
import { AuditLogTable } from "@/components/admin/audit-log-table";
import { EmptyState, ErrorState, PageHeader } from "@/components/empty-state";
import { requireStaff } from "@/lib/auth";
import { serverApi } from "@/lib/api/server";
import { toQuery } from "@/lib/format";
import type { AuditLogEntry, Paginated } from "@/lib/types";

export const metadata = { title: "Admin · Audit logs" };

export default async function AdminAuditLogsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireStaff();
  const sp = await searchParams;
  const actor = typeof sp.actor === "string" ? sp.actor : undefined;
  const action = typeof sp.action === "string" ? sp.action : undefined;
  const entity = typeof sp.entity === "string" ? sp.entity : undefined;

  let logs: AuditLogEntry[] = [];
  let loadError = false;
  try {
    const res = await serverApi<Paginated<AuditLogEntry>>(
      "GET",
      `/admin/audit-logs${toQuery({ actor, action, entity, per_page: 50 })}`,
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
        description="Admin mutations with redacted diffs. Flag and password fields are already masked by the server."
      />
      <AuditFilters actor={actor} action={action} entity={entity} />
      {loadError ? (
        <ErrorState description="Audit logs could not be loaded." />
      ) : logs.length === 0 ? (
        <EmptyState title="No audit events match" description="Clear the filters or perform an admin change." />
      ) : (
        <AuditLogTable rows={logs} />
      )}
    </div>
  );
}
