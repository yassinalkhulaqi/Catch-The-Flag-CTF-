import { AchievementCreateForm, AchievementList } from "@/components/admin/achievement-forms";
import { EmptyState, ErrorState, PageHeader } from "@/components/empty-state";
import { requireStaff } from "@/lib/auth";
import { serverApi } from "@/lib/api/server";
import type { AdminAchievement, Category } from "@/lib/types";

export const metadata = { title: "Admin · Achievements" };

export default async function AdminAchievementsPage() {
  const user = await requireStaff();
  let items: AdminAchievement[] = [];
  let categories: Category[] = [];
  let loadError = false;
  try {
    const [achievementRes, categoryRes] = await Promise.all([
      serverApi<{ data: AdminAchievement[] }>("GET", "/admin/achievements"),
      serverApi<{ data: Category[] }>("GET", "/categories"),
    ]);
    items = Array.isArray(achievementRes.data) ? achievementRes.data : [];
    categories = Array.isArray(categoryRes.data) ? categoryRes.data : [];
  } catch {
    loadError = true;
  }

  return (
    <div>
      <PageHeader
        eyebrow="Progression"
        title="Achievements"
        description="Badges awarded by server-side criteria. Deactivate a badge to stop new awards without erasing history."
      />
      {loadError ? (
        <ErrorState />
      ) : (
        <>
          <AchievementCreateForm categories={categories} />
          {items.length === 0 ? (
            <EmptyState
              className="mt-8"
              title="No achievements"
              description="Create the first badge with the form above."
            />
          ) : (
            <AchievementList
              items={items}
              categories={categories}
              canDelete={user.role === "admin"}
            />
          )}
        </>
      )}
    </div>
  );
}
