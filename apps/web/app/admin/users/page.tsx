import { AdminUsersTable } from "@/components/admin/users-table";
import { EmptyState, ErrorState, PageHeader } from "@/components/empty-state";
import { isAdmin, requireStaff } from "@/lib/auth";
import { serverApi } from "@/lib/api/server";
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
      <PageHeader
        eyebrow="Operations"
        title="Users"
        description="Accounts, roles, bans, and XP."
      />
      {loadError ? (
        <ErrorState />
      ) : (
        <AdminUsersTable users={users} currentUser={user} />
      )}
    </div>
  );
}
