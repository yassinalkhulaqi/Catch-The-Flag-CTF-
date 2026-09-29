import { EmptyState, ErrorState, PageHeader } from "@/components/empty-state";
import { PathCard } from "@/components/path-card";
import { serverApi } from "@/lib/api/server";
import type { Paginated, PathSummary } from "@/lib/types";

export const metadata = { title: "Learning paths" };

export default async function PathsPage() {
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
        title="Paths"
        description="Guided curricula that move from theory to practice challenges."
      />
      {loadError ? (
        <ErrorState />
      ) : paths.length === 0 ? (
        <EmptyState title="No paths published yet" />
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
