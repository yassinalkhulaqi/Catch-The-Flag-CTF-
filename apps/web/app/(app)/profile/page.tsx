import { SkillRadar } from "@/components/charts/skill-radar";
import { PageHeader } from "@/components/empty-state";
import { ProfileForm } from "@/components/profile-form";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { requireUser } from "@/lib/auth";
import { serverApi } from "@/lib/api/server";
import { dictionaryFor } from "@/lib/i18n/dictionary";
import { getLocale } from "@/lib/theme/locale";
import { formatXp, timeAgo } from "@/lib/utils";
import type { Achievement, ChallengeSummary, Paginated, SolveEntry } from "@/lib/types";

export const metadata = { title: "Profile" };

export default async function ProfilePage() {
  const user = await requireUser();
  const copy = dictionaryFor(await getLocale());
  let solves: SolveEntry[] = [];
  let achievements: Achievement[] = [];
  let solved: ChallengeSummary[] = [];

  try {
    const [solveRes, achievementRes, solvedRes] = await Promise.all([
      serverApi<Paginated<SolveEntry>>("GET", "/me/solves?per_page=20"),
      serverApi<{ data: Achievement[] }>("GET", "/me/achievements"),
      serverApi<Paginated<ChallengeSummary>>("GET", "/challenges?solved=true&per_page=100"),
    ]);
    solves = solveRes.data;
    achievements = achievementRes.data.filter((item) => item.awarded);
    solved = solvedRes.data;
  } catch {
    /* profile form still works from the session user */
  }

  const counts = new Map<string, number>();
  for (const challenge of solved) {
    counts.set(challenge.category.name, (counts.get(challenge.category.name) ?? 0) + 1);
  }
  const max = Math.max(1, ...counts.values());
  const radar = [...counts.entries()].map(([label, value]) => ({ label, value, max }));

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-2xl border border-border bg-surface">
        <div className="atmosphere h-24" />
        <div className="flex flex-wrap items-end gap-4 px-5 pb-5">
          <Avatar name={user.name} src={user.avatar_url} className="-mt-8 size-16 border-2 border-surface" />
          <div>
            <p className="type-eyebrow text-accent">{copy.profile.eyebrow}</p>
            <h1 className="font-display text-3xl font-semibold">{user.name}</h1>
            <p className="font-mono text-sm text-muted">
              {formatXp(user.xp)} XP · {user.solved_count} solves
            </p>
          </div>
        </div>
      </section>

      <section aria-labelledby="public-preview" className="rounded-xl border border-border p-4">
        <h2 id="public-preview" className="font-semibold">
          {copy.profile.public}
        </h2>
        <p className="mt-1 text-sm text-muted">{copy.profile.publicBody}</p>
        <ul className="mt-3 flex flex-wrap gap-2">
          {achievements.map((item) => (
            <li key={item.id}>
              <Badge tone="success">{item.title}</Badge>
            </li>
          ))}
        </ul>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section aria-labelledby="timeline">
          <h2 id="timeline" className="type-eyebrow text-accent">
            {copy.profile.timeline}
          </h2>
          {solves.length === 0 ? (
            <p className="mt-3 text-sm text-muted">{copy.profile.noSolves}</p>
          ) : (
            <ol className="mt-3 space-y-3 border-s border-border ps-4">
              {solves.map((solve) => (
                <li key={solve.id}>
                  <p className="font-medium">{solve.challenge.title}</p>
                  <p className="font-mono text-xs text-faint">
                    {formatXp(solve.points_awarded)} XP · {timeAgo(solve.solved_at)}
                  </p>
                </li>
              ))}
            </ol>
          )}
        </section>
        <section aria-labelledby="profile-radar">
          <h2 id="profile-radar" className="type-eyebrow text-accent">
            {copy.achievements.title}
          </h2>
          {radar.length === 0 ? (
            <p className="mt-3 text-sm text-muted">{copy.profile.noSolves}</p>
          ) : (
            <SkillRadar points={radar} />
          )}
        </section>
      </div>

      <PageHeader eyebrow={copy.profile.eyebrow} title={copy.profile.title} />
      <ProfileForm user={user} />
    </div>
  );
}
