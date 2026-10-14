import { SkillRadar } from "@/components/charts/skill-radar";
import { PageHeader } from "@/components/empty-state";
import { ProfileForm } from "@/components/profile-form";
import { TrackBadges } from "@/components/track-badges";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { requireUser } from "@/lib/auth";
import { serverApi } from "@/lib/api/server";
import { levelFromXp } from "@/lib/design/level";
import { dictionaryFor } from "@/lib/i18n/dictionary";
import { getLocale } from "@/lib/theme/locale";
import { TRACKS, trackForChallenge } from "@/lib/tracks";
import { formatXp, timeAgo } from "@/lib/utils";
import type { Achievement, ChallengeSummary, Paginated, SolveEntry } from "@/lib/types";

export const metadata = { title: "Profile" };

function buildTrackCounts(
  solves: SolveEntry[],
  catalog: ChallengeSummary[],
) {
  const solvedPerTrack = new Map<string, number>();
  for (const solve of solves) {
    const track = trackForChallenge(
      solve.challenge.category.slug,
      solve.challenge.tags.map((tag) => tag.slug),
    );
    solvedPerTrack.set(track.slug, (solvedPerTrack.get(track.slug) ?? 0) + 1);
  }
  const totalPerTrack = new Map<string, number>();
  for (const challenge of catalog) {
    const track = trackForChallenge(
      challenge.category.slug,
      challenge.tags.map((tag) => tag.slug),
    );
    totalPerTrack.set(track.slug, (totalPerTrack.get(track.slug) ?? 0) + 1);
  }
  return { solvedPerTrack, totalPerTrack };
}

export default async function ProfilePage() {
  const user = await requireUser();
  const copy = dictionaryFor(await getLocale());
  let solves: SolveEntry[] = [];
  let achievements: Achievement[] = [];
  let catalog: ChallengeSummary[] = [];

  try {
    const [solveRes, achievementRes, catalogRes] = await Promise.all([
      serverApi<Paginated<SolveEntry>>("GET", "/me/solves?per_page=100"),
      serverApi<{ data: Achievement[] }>("GET", "/me/achievements"),
      serverApi<Paginated<ChallengeSummary>>("GET", "/challenges?per_page=100"),
    ]);
    solves = solveRes.data;
    achievements = achievementRes.data.filter((item) => item.awarded);
    catalog = catalogRes.data;
  } catch {
    /* profile form still works from the session user */
  }

  const { solvedPerTrack, totalPerTrack } = buildTrackCounts(solves, catalog);
  const radarData = TRACKS.map((track) => ({
    track: track.title,
    value: solvedPerTrack.get(track.slug) ?? 0,
  }));
  const radarMax = Math.max(
    1,
    ...TRACKS.map((track) => totalPerTrack.get(track.slug) ?? 0),
    ...radarData.map((datum) => datum.value),
  );
  const badgeTracks = TRACKS.map((track) => ({
    name: track.title,
    solved: solvedPerTrack.get(track.slug) ?? 0,
    total: totalPerTrack.get(track.slug) ?? 0,
  }));
  const level = levelFromXp(user.xp);
  const timeline = solves.slice(0, 20);

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-2xl border border-border bg-surface">
        <div className="atmosphere h-24" />
        <div className="flex flex-wrap items-end gap-4 px-5 pb-5">
          <Avatar name={user.name} src={user.avatar_url} className="-mt-8 size-16 border-2 border-surface" />
          <div className="min-w-0 flex-1">
            <p className="type-eyebrow text-accent">{copy.profile.eyebrow}</p>
            <h1 className="font-display text-3xl font-semibold">{user.name}</h1>
            <p className="font-mono text-sm text-muted">
              {formatXp(user.xp)} XP · {user.solved_count} solves · Level {level.level}
            </p>
            <div className="mt-2 max-w-xs">
              <Progress
                value={level.into}
                max={level.span}
                label={`Level ${level.level}, ${level.into} of ${level.span} XP toward level ${level.level + 1}`}
              />
              <p className="mt-1 text-xs text-muted">
                {formatXp(level.into)} / {formatXp(level.span)} XP to level {level.level + 1}
              </p>
            </div>
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
          {timeline.length === 0 ? (
            <p className="mt-3 text-sm text-muted">{copy.profile.noSolves}</p>
          ) : (
            <ol className="mt-3 space-y-3 border-s border-border ps-4">
              {timeline.map((solve) => (
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
        <section
          aria-labelledby="profile-radar"
          className="rounded-xl border border-border bg-surface p-4"
        >
          <h2 id="profile-radar" className="type-eyebrow text-accent">
            Skills by track
          </h2>
          <div className="mt-3">
            <SkillRadar data={radarData} max={radarMax} />
          </div>
          {solves.length === 0 ? (
            <p className="mt-3 text-sm text-muted">{copy.profile.noSolves}</p>
          ) : null}
        </section>
      </div>

      <section aria-labelledby="profile-badges">
        <h2 id="profile-badges" className="type-eyebrow text-accent">
          Track badges
        </h2>
        <p className="mt-1 text-sm text-muted">
          A track unlocks when every visible catalog challenge in that track is solved.
        </p>
        <div className="mt-3">
          <TrackBadges tracks={badgeTracks} />
        </div>
      </section>

      <PageHeader eyebrow={copy.profile.eyebrow} title={copy.profile.title} />
      <ProfileForm user={user} />
    </div>
  );
}
