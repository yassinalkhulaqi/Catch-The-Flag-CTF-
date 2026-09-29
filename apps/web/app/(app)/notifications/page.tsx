import { ErrorState, PageHeader } from "@/components/empty-state";
import { NotificationsList } from "@/components/notifications-list";
import { requireUser } from "@/lib/auth";
import { serverApi } from "@/lib/api/server";
import type { NotificationItem, Paginated } from "@/lib/types";

export const metadata = {
  title: "Notifications",
  description: "Your Catch The Flag activity alerts.",
};

export default async function NotificationsPage() {
  await requireUser();
  let items: NotificationItem[] = [];
  let loadError = false;
  try {
    const res = await serverApi<Paginated<NotificationItem>>("GET", "/me/notifications");
    items = Array.isArray(res.data) ? res.data : [];
  } catch {
    loadError = true;
  }

  return (
    <div>
      <PageHeader
        eyebrow="Account"
        title="Notifications"
        description="Achievement unlocks and solve confirmations."
      />
      {loadError ? <ErrorState /> : <NotificationsList items={items} />}
    </div>
  );
}
