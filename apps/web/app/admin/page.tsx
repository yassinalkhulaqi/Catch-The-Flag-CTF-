import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { getAdminDashboardServer } from "@/lib/api/admin-server";
import { timeAgo } from "@/lib/utils";
import type { ContentStatus } from "@/lib/types";

export const metadata: Metadata = { title: "Admin overview" };

const STATUS_META: Array<{
  status: ContentStatus;
  label: string;
  tone: "neutral" | "info" | "success";
}> = [
  { status: "draft", label: "Draft", tone: "neutral" },
  { status: "review", label: "In review", tone: "info" },
  { status: "published", label: "Published", tone: "success" },
  { status: "archived", label: "Archived", tone: "neutral" },
];

function describeActor(actor: unknown): string {
  if (actor === null || actor === undefined) return "system";
  if (typeof actor === "string") return actor;
  if (typeof actor === "object") {
    const record = actor as Record<string, unknown>;
    if (typeof record.name === "string") return record.name;
    if (typeof record.email === "string") return record.email;
    if (typeof record.id === "number" || typeof record.id === "string") {
      return `user #${record.id}`;
    }
  }
  return "staff";
}

function describeTarget(auditable: unknown): string {
  if (auditable === null || auditable === undefined) return "—";
  if (typeof auditable === "string") return auditable;
  if (typeof auditable === "object") {
    const record = auditable as Record<string, unknown>;
    const type =
      typeof record.type === "string" ? record.type : "record";
    const id = record.id ?? record.auditable_id;
    return typeof id === "number" || typeof id === "string"
      ? `${type} #${id}`
      : type;
  }
  return "—";
}

/** Staff dashboard: content counts, user/path totals, recent audit trail. */
export default async function AdminDashboardPage() {
  const dashboard = await getAdminDashboardServer();
  const totalChallenges = STATUS_META.reduce(
    (sum, s) => sum + dashboard.byStatus[s.status],
    0,
  );

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
        Overview
      </h1>
      <p className="mt-1 text-sm text-muted">
        Content pipeline, community totals, and the latest audited actions.
      </p>

      <section aria-label="Challenge counts" className="mt-6">
        <h2 className="text-sm font-medium text-muted">
          Challenges · {totalChallenges} total
        </h2>
        <ul className="mt-2 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {STATUS_META.map(({ status, label, tone }) => (
            <li key={status}>
              <Link
                href={`/admin/challenges?status=${status}`}
                className="block rounded-lg border border-border bg-surface p-4 transition-colors hover:border-border-strong"
              >
                <span className="text-2xl font-semibold text-foreground">
                  {dashboard.byStatus[status]}
                </span>
                <span className="mt-2 block">
                  <Badge tone={tone}>{label}</Badge>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-label="Community totals" className="mt-6">
        <ul className="grid gap-3 sm:grid-cols-2">
          <li>
            <Card>
              <CardTitle>Users</CardTitle>
              <p className="mt-2 text-2xl font-semibold text-foreground">
                {dashboard.usersTotal}
              </p>
              <CardDescription className="mt-1">
                <Link href="/admin/users" className="hover:text-accent">
                  Moderate roles, bans and XP →
                </Link>
              </CardDescription>
            </Card>
          </li>
          <li>
            <Card>
              <CardTitle>Learning paths</CardTitle>
              <p className="mt-2 text-2xl font-semibold text-foreground">
                {dashboard.pathsTotal}
              </p>
              <CardDescription className="mt-1">
                <Link href="/admin/paths" className="hover:text-accent">
                  Author curricula →
                </Link>
              </CardDescription>
            </Card>
          </li>
        </ul>
      </section>

      <section aria-label="Recent audit activity" className="mt-6">
        <h2 className="text-sm font-medium text-muted">Recent audit activity</h2>
        {dashboard.recentAudit.length === 0 ? (
          <Card className="mt-2">
            <CardTitle>No audit entries yet</CardTitle>
            <CardDescription className="mt-2">
              The backend may be unreachable, or no admin actions have been
              recorded. Every admin mutation is logged here once available.
            </CardDescription>
          </Card>
        ) : (
          <ul className="mt-2 space-y-2">
            {dashboard.recentAudit.map((entry, i) => (
              <li
                key={`${entry.id}-${i}`}
                className="flex flex-wrap items-baseline justify-between gap-2 rounded-md border border-border bg-surface px-3 py-2 text-sm"
              >
                <span className="min-w-0">
                  <span className="font-mono text-xs text-accent">
                    {entry.action}
                  </span>{" "}
                  <span className="text-muted">
                    by {describeActor(entry.actor)} on{" "}
                    {describeTarget(entry.auditable)}
                  </span>
                </span>
                <span className="text-xs text-faint">
                  {entry.created_at ? timeAgo(entry.created_at) : "—"}
                </span>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 text-sm text-muted">
          <Link href="/admin/audit-log" className="hover:text-accent">
            Full audit log →
          </Link>
        </p>
      </section>
    </div>
  );
}
