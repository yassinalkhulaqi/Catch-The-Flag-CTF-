import { EmptyState, ErrorState, PageHeader } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { requireUser } from "@/lib/auth";
import { serverApi } from "@/lib/api/server";
import type { Achievement } from "@/lib/types";

export const metadata = { title: "Achievements" };

export default async function AchievementsPage() {
  await requireUser();

  let items: Achievement[] = [];
  let loadError = false;
  try {
    const res = await serverApi<{ data: Achievement[] }>("GET", "/me/achievements");
    items = res.data;
  } catch {
    loadError = true;
  }

  return (
    <div>
      <PageHeader
        eyebrow="Account"
        title="Achievements"
        description="Unlocked badges and progress toward the rest."
      />
      {loadError ? (
        <ErrorState />
      ) : items.length === 0 ? (
        <EmptyState title="No achievements configured" />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {items.map((a) => (
            <li
              key={a.id}
              className={
                a.awarded
                  ? "border border-accent/30 bg-accent/5 p-4"
                  : "border border-border bg-surface p-4 opacity-80"
              }
            >
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-semibold text-foreground">{a.title}</h2>
                {a.awarded ? <Badge tone="success">Unlocked</Badge> : <Badge>Locked</Badge>}
              </div>
              <p className="mt-1 text-sm text-muted">{a.description}</p>
              {!a.awarded && a.progress ? (
                <div className="mt-3 space-y-1">
                  <Progress
                    value={a.progress.current}
                    max={a.progress.target}
                    label={`${a.title} progress`}
                  />
                  <p className="font-mono text-xs text-faint">
                    {a.progress.current} / {a.progress.target}
                  </p>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
