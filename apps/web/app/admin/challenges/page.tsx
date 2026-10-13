import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { listAdminChallengesServer } from "@/lib/api/admin-server";
import { cn } from "@/lib/utils";
import type { ContentStatus } from "@/lib/types";

export const metadata: Metadata = { title: "Admin · Challenges" };

const FILTERS: Array<{ value: string; label: string }> = [
  { value: "", label: "All" },
  { value: "draft", label: "Draft" },
  { value: "review", label: "Review" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
];

const STATUS_TONE: Record<ContentStatus, "neutral" | "info" | "success"> = {
  draft: "neutral",
  review: "info",
  published: "success",
  archived: "neutral",
};

function isStatus(value: string | undefined): value is ContentStatus {
  return (
    value === "draft" ||
    value === "review" ||
    value === "published" ||
    value === "archived"
  );
}

/** Admin challenge table with server-side status filter. */
export default async function AdminChallengesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const params = await searchParams;
  const active = isStatus(params.status) ? params.status : "";
  const { items, total } = await listAdminChallengesServer({
    status: active || undefined,
    per_page: 100,
  });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Challenges
          </h1>
          <p className="mt-1 text-sm text-muted">
            {total} {total === 1 ? "challenge" : "challenges"}
            {active ? ` with status “${active}”` : " across all statuses"}.
          </p>
        </div>
        <Link
          href="/admin/challenges/new"
          className={buttonVariants("primary", "sm")}
        >
          New challenge
        </Link>
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5" role="group" aria-label="Filter by status">
        {FILTERS.map((f) => {
          const selected = active === f.value;
          return (
            <Link
              key={f.label}
              href={f.value ? `/admin/challenges?status=${f.value}` : "/admin/challenges"}
              aria-current={selected ? "true" : undefined}
              className={cn(
                "rounded-md border px-3 py-1.5 text-sm",
                selected
                  ? "border-accent/40 bg-accent/10 text-accent"
                  : "border-border text-muted hover:text-foreground",
              )}
            >
              {f.label}
            </Link>
          );
        })}
      </div>

      {items.length === 0 ? (
        <Card className="mt-4">
          <CardTitle>No challenges found</CardTitle>
          <CardDescription className="mt-2">
            {active
              ? "Nothing in this status yet — try another filter or author a new challenge."
              : "The backend may be unreachable, or no challenges exist yet. Author the first one to get started."}
          </CardDescription>
        </Card>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-raised text-xs uppercase tracking-wide text-muted">
                <th scope="col" className="px-4 py-2.5 font-medium">Title</th>
                <th scope="col" className="px-4 py-2.5 font-medium">Status</th>
                <th scope="col" className="px-4 py-2.5 font-medium">Difficulty</th>
                <th scope="col" className="px-4 py-2.5 text-right font-medium">Points</th>
              </tr>
            </thead>
            <tbody>
              {items.map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-border bg-surface last:border-b-0 hover:bg-surface-raised"
                >
                  <td className="px-4 py-2.5">
                    <Link
                      href={`/admin/challenges/${c.id}`}
                      className="font-medium text-foreground hover:text-accent"
                    >
                      {c.title}
                    </Link>
                    <span className="block font-mono text-xs text-faint">
                      {c.slug}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <Badge tone={STATUS_TONE[c.status] ?? "neutral"}>
                      {c.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-2.5 text-muted">{c.difficulty}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-foreground">
                    {c.points}
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
