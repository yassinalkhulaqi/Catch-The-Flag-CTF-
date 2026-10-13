import { EmptyState, ErrorState, PageHeader } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { requireUser } from "@/lib/auth";
import { serverApi } from "@/lib/api/server";
import { dictionaryFor } from "@/lib/i18n/dictionary";
import { getLocale } from "@/lib/theme/locale";
import { cn } from "@/lib/utils";
import type { Achievement } from "@/lib/types";

export const metadata = { title: "Achievements" };

export default async function AchievementsPage() {
  await requireUser();
  const copy = dictionaryFor(await getLocale());

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
        eyebrow={copy.achievements.eyebrow}
        title={copy.achievements.title}
        description={copy.achievements.description}
      />
      <p className="mb-4 text-sm text-muted">{copy.achievements.grouping}</p>
      {loadError ? (
        <ErrorState />
      ) : items.length === 0 ? (
        <EmptyState title={copy.achievements.empty} description={copy.achievements.emptyBody} />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {items.map((a) => (
            <li
              key={a.id}
              className={cn(
                "rounded-xl border p-4",
                a.awarded ? "animate-pop border-accent/30 bg-accent/5" : "border-border bg-surface",
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-mono text-[11px] uppercase text-faint">{targetBand(a.progress?.target)}</p>
                  <h2 className="font-semibold text-foreground">{a.title}</h2>
                </div>
                {a.awarded ? (
                  <Badge tone="success">{copy.achievements.unlocked}</Badge>
                ) : (
                  <Badge>{copy.achievements.locked}</Badge>
                )}
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

function targetBand(target: number | undefined): string {
  if (!target) return "No target";
  if (target >= 50) return "Target 50+";
  if (target >= 10) return "Target 10+";
  return "Target under 10";
}
