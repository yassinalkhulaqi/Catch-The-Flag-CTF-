import { EmptyState, ErrorState, PageHeader } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { isAdmin, requireStaff } from "@/lib/auth";
import { serverApi } from "@/lib/api/server";
import { formatXp } from "@/lib/utils";
import type { CurrentUser, Paginated } from "@/lib/types";

export const metadata = { title: "Admin · Users" };

export default async function AdminUsersPage() {
  const user = await requireStaff();

  if (!isAdmin(user)) {
    return (
      <EmptyState
        title="Admin only"
        description="User management requires the admin role. Moderators can manage content."
      />
    );
  }

  let users: CurrentUser[] = [];
  let loadError = false;
  try {
    const res = await serverApi<Paginated<CurrentUser>>("GET", "/admin/users?per_page=50");
    users = res.data;
  } catch {
    loadError = true;
  }

  return (
    <div>
      <PageHeader eyebrow="Operations" title="Users" description="Accounts, roles, and XP." />
      {loadError ? (
        <ErrorState />
      ) : (
        <div className="overflow-x-auto border border-border">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-border bg-surface font-mono text-[11px] uppercase text-muted">
              <tr>
                <th className="px-3 py-2">ID</th>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Email</th>
                <th className="px-3 py-2">Role</th>
                <th className="px-3 py-2">XP</th>
                <th className="px-3 py-2">Solves</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-border/70">
                  <td className="px-3 py-2 font-mono text-faint">{u.id}</td>
                  <td className="px-3 py-2">{u.name}</td>
                  <td className="px-3 py-2 text-muted">{u.email}</td>
                  <td className="px-3 py-2">
                    <Badge>{u.role}</Badge>
                  </td>
                  <td className="px-3 py-2 font-mono">{formatXp(u.xp)}</td>
                  <td className="px-3 py-2 font-mono">{u.solved_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
