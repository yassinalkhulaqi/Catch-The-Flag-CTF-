import { EmptyState, ErrorState, PageHeader } from "@/components/empty-state";
import { PathCard } from "@/components/path-card";
import { serverApi } from "@/lib/api/server";
import { dictionaryFor } from "@/lib/i18n/dictionary";
import { getLocale } from "@/lib/theme/locale";
import type { Paginated, PathSummary } from "@/lib/types";

export const metadata = {
  title: "Learning paths",
  description:
    "Guided cybersecurity curricula that move from theory to practice challenges across DFIR, malware, reverse engineering, crypto, and more.",
};

export default async function PathsPage() {
  const copy = dictionaryFor(await getLocale());
  let paths: PathSummary[] = [];
  let loadError = false;
  try {
    const res = await serverApi<Paginated<PathSummary>>("GET", "/paths?per_page=50");
    paths = res.data;
  } catch {
    loadError = true;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <PageHeader
        eyebrow="Learn"
        title={copy.pages.pathsTitle}
        description={copy.pages.pathsBody}
      />
      {loadError ? (
        <ErrorState />
      ) : paths.length === 0 ? (
        <EmptyState title={copy.pages.pathsEmpty} description={copy.pages.pathsEmptyBody} />
      ) : (
        <div className="border-t border-border">
          {paths.map((p) => (
            <PathCard key={p.id} path={p} />
          ))}
        </div>
      )}
    </div>
  );
}
