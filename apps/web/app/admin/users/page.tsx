import type { Metadata } from "next";
import { UserActions } from "@/components/admin/user-actions";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { listAdminUsersServer } from "@/lib/api/admin-server";
import { formatXp } from "@/lib/utils";

export const metadata: Metadata = { title: "Admin · Users" };

/** User moderation table with per-row action islands. */
export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const q = params.q?.trim() || undefined;
  const { items, total } = await listAdminUsersServer({ q, per_page: 100 });

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
        Users
      </h1>
      <p className="mt-1 text-sm text-muted">
        {total} {total === 1 ? "account" : "accounts"}
        {q ? ` matching “${q}”` : ""}. Bans, role changes and XP adjustments
        are audit logged.
      </p>

      <form method="get" action="/admin/users" className="mt-4 flex max-w-md gap-2" role="search" aria-label="Search users">
        <label htmlFor="user-search" className="sr-only">
          Search by name or email
        </label>
        <input
          id="user-search"
          name="q"
          type="search"
          defaultValue={q ?? ""}
          placeholder="Search name or email…"
          className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-faint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
        />
        <button
          type="submit"
          className="inline-flex h-10 cursor-pointer items-center rounded-md border border-border bg-surface-raised px-4 text-sm text-foreground hover:bg-border"
        >
          Search
        </button>
      </form>

      {items.length === 0 ? (
        <Card className="mt-4">
          <CardTitle>No users found</CardTitle>
          <CardDescription className="mt-2">
            {q
              ? "Try a different search term."
              : "The backend may be unreachable."}
          </CardDescription>
        </Card>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-raised text-xs uppercase tracking-wide text-muted">
                <th scope="col" className="px-4 py-2.5 font-medium">User</th>
                <th scope="col" className="px-4 py-2.5 font-medium">Role</th>
                <th scope="col" className="px-4 py-2.5 text-right font-medium">XP</th>
                <th scope="col" className="px-4 py-2.5 font-medium">Status</th>
                <th scope="col" className="px-4 py-2.5 font-medium">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((u) => {
                const banned = u.banned_at !== null;
                return (
                  <tr
                    key={u.id}
                    className="border-b border-border bg-surface align-top last:border-b-0"
                  >
                    <td className="px-4 py-2.5">
                      <span className="font-medium text-foreground">{u.name}</span>
                      <span className="block text-xs text-faint">{u.email}</span>
                    </td>
                    <td className="px-4 py-2.5">
                      <Badge tone={u.role === "user" ? "neutral" : "accent"}>
                        {u.role}
                      </Badge>
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-foreground">
                      {formatXp(u.xp)}
                    </td>
                    <td className="px-4 py-2.5">
                      <Badge tone={banned ? "danger" : "success"}>
                        {banned ? "banned" : "active"}
                      </Badge>
                    </td>
                    <td className="min-w-64 px-4 py-2.5">
                      <UserActions user={u} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
