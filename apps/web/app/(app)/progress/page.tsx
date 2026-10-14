import Link from "next/link";
import { SkillRadar } from "@/components/charts/skill-radar";
import { EmptyState, ErrorState, PageHeader } from "@/components/empty-state";
import { PathCard } from "@/components/path-card";
import { TrackBadges } from "@/components/track-badges";
import { Progress } from "@/components/ui/progress";
import { requireUser } from "@/lib/auth";
import { serverApi } from "@/lib/api/server";
import { levelFromXp } from "@/lib/design/level";
import { dictionaryFor } from "@/lib/i18n/dictionary";
import { getLocale } from "@/lib/theme/locale";
import { TRACKS, trackForChallenge } from "@/lib/tracks";
import { formatXp } from "@/lib/utils";
import type {
  ChallengeSummary,
  Paginated,
  PathSummary,
  ProgressOverview,
  SolveEntry,
  XpEntry,
} from "@/lib/types";

export const metadata = { title: "My progress" };

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

export default async function ProgressPage() {
  const user = await requireUser();
  const copy = dictionaryFor(await getLocale());

  let overview: ProgressOverview | null = null;
  let paths: PathSummary[] = [];
  let ledger: XpEntry[] = [];
  let loadError = false;

  try {
    const [prog, pathRes, xpRes] = await Promise.all([
      serverApi<{ data: ProgressOverview }>("GET", "/me/progress"),
      serverApi<Paginated<PathSummary>>("GET", "/paths?per_page=50"),
      serverApi<Paginated<XpEntry>>("GET", "/me/xp-ledger?per_page=10"),
    ]);
    overview = prog.data;
    paths = pathRes.data.filter((p) => p.progress_percent > 0);
    ledger = xpRes.data;
  } catch {
    loadError = true;
  }

  let solves: SolveEntry[] = [];
  let catalog: ChallengeSummary[] = [];
  try {
    const [solveRes, catalogRes] = await Promise.all([
      serverApi<Paginated<SolveEntry>>("GET", "/me/solves?per_page=100"),
      serverApi<Paginated<ChallengeSummary>>("GET", "/challenges?per_page=100"),
    ]);
    solves = solveRes.data;
    catalog = catalogRes.data;
  } catch {
    /* track sections render empty states; paths + ledger still work */
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
  const xp = overview?.xp ?? user.xp;
  const level = levelFromXp(xp);

  return (
    <div>
      <PageHeader
        eyebrow="Account"
        title={copy.pages.progressTitle}
        description={copy.pages.progressBody}
      />

      {loadError ? (
        <ErrorState />
      ) : (
        <>
          {overview ? (
            <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Stat label="Level" value={String(level.level)} />
              <Stat label="XP" value={formatXp(overview.xp)} />
              <Stat label="Lessons done" value={String(overview.lessons_completed)} />
              <Stat label="Paths completed" value={String(overview.paths_completed)} />
            </div>
          ) : null}
          <div className="mb-8 max-w-md">
            <Progress
              value={level.into}
              max={level.span}
              label={`Level ${level.level}, ${level.into} of ${level.span} XP toward level ${level.level + 1}`}
            />
            <p className="mt-1 text-xs text-muted">
              Level {level.level} · {formatXp(level.into)} / {formatXp(level.span)} XP to
              level {level.level + 1}
            </p>
          </div>

          <section
            aria-labelledby="skills-radar"
            className="mb-10 rounded-xl border border-border bg-surface p-4"
          >
            <h2
              id="skills-radar"
              className="mb-3 font-mono text-xs uppercase tracking-[0.16em] text-accent"
            >
              Skills by track
            </h2>
            <SkillRadar data={radarData} max={radarMax} />
            {solves.length === 0 ? (
              <p className="mt-3 text-sm text-muted">
                Solve a challenge and this chart fills in from the server.
              </p>
            ) : null}
          </section>

          <section aria-labelledby="track-badges" className="mb-10">
            <h2
              id="track-badges"
              className="mb-1 font-mono text-xs uppercase tracking-[0.16em] text-accent"
            >
              Track badges
            </h2>
            <p className="mb-3 text-sm text-muted">
              A track unlocks when every visible catalog challenge in that track is
              solved.
            </p>
            <TrackBadges tracks={badgeTracks} />
          </section>

          <section className="mb-10" aria-labelledby="paths-progress">
            <h2
              id="paths-progress"
              className="mb-3 font-mono text-xs uppercase tracking-[0.16em] text-accent"
            >
              Started paths
            </h2>
            {paths.length === 0 ? (
              <EmptyState
                title="No paths started"
                description="Pick a learning path to begin."
                action={
                  <Link href="/paths" className="text-sm text-accent hover:underline">
                    Browse paths
                  </Link>
                }
              />
            ) : (
              <div className="border-t border-border">
                {paths.map((p) => (
                  <PathCard key={p.id} path={p} />
                ))}
              </div>
            )}
          </section>

          <section aria-labelledby="xp-heading">
            <h2
              id="xp-heading"
              className="mb-3 font-mono text-xs uppercase tracking-[0.16em] text-accent"
            >
              XP ledger
            </h2>
            {ledger.length === 0 ? (
              <p className="text-sm text-muted">No XP transactions yet.</p>
            ) : (
              <ul className="divide-y divide-border border border-border">
                {ledger.map((row) => (
                  <li key={row.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                    <div>
                      <p className="text-foreground">{row.description || row.reason}</p>
                      <p className="font-mono text-xs text-faint">
                        {new Date(row.created_at).toLocaleString()}
                      </p>
                    </div>
                    <span className="font-mono text-accent">+{formatXp(row.amount)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-border bg-surface p-4">
      <p className="font-mono text-[11px] uppercase text-muted">{label}</p>
      <p className="mt-1 font-display text-xl font-semibold">{value}</p>
    </div>
  );
}
