import { EmptyState, ErrorState, PageHeader } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { requireStaff } from "@/lib/auth";
import { serverApi } from "@/lib/api/server";
import type { Achievement } from "@/lib/types";

export const metadata = { title: "Admin · Achievements" };

export default async function AdminAchievementsPage() {
  await requireStaff();
  let items: Achievement[] = [];
  let loadError = false;
  try {
    const res = await serverApi<{ data: Achievement[] }>("GET", "/admin/achievements");
    items = Array.isArray(res.data) ? res.data : [];
  } catch {
    loadError = true;
  }

  return (
    <div>
      <PageHeader
        eyebrow="Progression"
        title="Achievements"
        description="Badges awarded by server-side criteria."
      />
      {loadError ? (
        <ErrorState />
      ) : items.length === 0 ? (
        <EmptyState title="No achievements" />
      ) : (
        <ul className="divide-y divide-border border-t border-border">
          {items.map((a) => (
            <li key={a.id} className="py-4">
              <div className="flex items-center gap-2">
                <p className="font-semibold">{a.title}</p>
                <Badge className="font-mono normal-case">{a.key}</Badge>
              </div>
              <p className="mt-1 text-sm text-muted">{a.description}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
