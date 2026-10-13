import type { Metadata } from "next";
import Link from "next/link";
import { PathCreateForm } from "@/components/admin/path-create-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { listAdminPathsServer } from "@/lib/api/admin-server";

export const metadata: Metadata = { title: "Admin · Paths" };

/** Minimal path management: table + create form. */
export default async function AdminPathsPage() {
  const { items, total } = await listAdminPathsServer();

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
        Paths
      </h1>
      <p className="mt-1 text-sm text-muted">
        {total} {total === 1 ? "path" : "paths"} across all statuses.
      </p>

      <Card className="mt-6">
        <CardTitle>Create path</CardTitle>
        <div className="mt-4">
          <PathCreateForm />
        </div>
      </Card>

      {items.length === 0 ? (
        <Card className="mt-6">
          <CardTitle>No paths yet</CardTitle>
          <CardDescription className="mt-2">
            The backend may be unreachable, or no paths exist. Create the
            first one above.
          </CardDescription>
        </Card>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-raised text-xs uppercase tracking-wide text-muted">
                <th scope="col" className="px-4 py-2.5 font-medium">Title</th>
                <th scope="col" className="px-4 py-2.5 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {items.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-border bg-surface last:border-b-0 hover:bg-surface-raised"
                >
                  <td className="px-4 py-2.5">
                    <span className="font-medium text-foreground">{p.title}</span>
                    <span className="block font-mono text-xs text-faint">
                      {p.slug}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <Badge tone={p.status === "published" ? "success" : "neutral"}>
                      {p.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="mt-3 text-sm text-muted">
        <Link href="/admin" className="hover:text-accent">
          ← Back to overview
        </Link>
      </p>
    </div>
  );
}
