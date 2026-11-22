import { CabinetGrid } from "@/components/achievements/cabinet-grid";
import { CabinetHero } from "@/components/achievements/cabinet-hero";
import { EmptyState, ErrorState, PageHeader } from "@/components/empty-state";
import { serverApi } from "@/lib/api/server";
import { cabinetSummary } from "@/lib/achievements/cabinet";
import { requireUser } from "@/lib/auth";
import { dictionaryFor } from "@/lib/i18n/dictionary";
import { getLocale } from "@/lib/theme/locale";
import type { Achievement } from "@/lib/types";

export const metadata = { title: "Achievements" };

export default async function AchievementsPage() {
  await requireUser();
  const dict = dictionaryFor(await getLocale());
  const copy = dict.achievements;

  let items: Achievement[] = [];
  let loadError = false;
  try {
    const res = await serverApi<{ data: Achievement[] }>("GET", "/me/achievements");
    items = res.data;
  } catch {
    loadError = true;
  }

  if (loadError) return <ErrorState />;

  if (items.length === 0) {
    return (
      <div>
        <PageHeader
          eyebrow={copy.eyebrow}
          title={copy.title}
          description={copy.description}
        />
        <EmptyState title={copy.empty} description={copy.emptyBody} />
      </div>
    );
  }

  const summary = cabinetSummary(items);

  return (
    <div>
      <CabinetHero copy={copy} summary={summary} />
      <CabinetGrid items={items} copy={copy} />
    </div>
  );
}
