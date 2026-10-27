import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Reveal } from "@/lib/motion/reveal";
import { TRACKS, trackForChallenge } from "@/lib/tracks";
import type { ChallengeSummary } from "@/lib/types";

export function ChallengeTracks({ challenges }: { challenges: ChallengeSummary[] }) {
  const stats = new Map<string, { total: number; solved: number }>();
  for (const track of TRACKS) stats.set(track.slug, { total: 0, solved: 0 });

  for (const challenge of challenges) {
    const track = trackForChallenge(
      challenge.category.slug,
      challenge.tags.map((tag) => tag.slug),
    );
    const stat = stats.get(track.slug);
    if (!stat) continue;
    stat.total += 1;
    if (challenge.solved) stat.solved += 1;
  }

  const visibleTracks = TRACKS.filter((track) => (stats.get(track.slug)?.total ?? 0) > 0);

  if (visibleTracks.length === 0) return null;

  return (
    <section aria-label="Browse by vulnerability track" className="mb-8">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Browse by track</h2>
          <p className="text-sm text-muted">Vulnerability topics grouped from the listed challenges.</p>
        </div>
        <span className="font-mono text-[11px] uppercase tracking-wide text-faint">
          {visibleTracks.length} tracks
        </span>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {visibleTracks.map((track, index) => {
          const stat = stats.get(track.slug) ?? { total: 0, solved: 0 };
          const ratio = stat.total > 0 ? stat.solved / stat.total : 0;
          const done = stat.total > 0 && stat.solved === stat.total;
          const query = track.tagSlugs[0] ?? track.categorySlugs[0];
          return (
            <Reveal key={track.slug} as="li" delay={Math.min(index * 40, 240)}>
              <Link
                href={`/challenges?tags=${encodeURIComponent(query)}`}
                className="group flex h-full flex-col rounded-xl border border-border bg-surface p-4 transition-colors hover:border-border-strong"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-semibold text-foreground group-hover:text-accent">
                    {track.title}
                  </h3>
                  <ArrowUpRight
                    aria-hidden="true"
                    className="size-3.5 text-faint transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent"
                  />
                </div>
                <p className="mt-1 min-h-10 flex-1 text-xs leading-relaxed text-muted">
                  {track.blurb}
                </p>
                <div className="mt-3 flex items-center justify-between gap-2 font-mono text-[11px]">
                  <span className={done ? "text-success" : "text-faint"}>
                    {stat.solved}/{stat.total} solved
                  </span>
                  <span className="text-faint">{Math.round(ratio * 100)}%</span>
                </div>
                <Progress
                  value={stat.solved}
                  max={Math.max(1, stat.total)}
                  label={`${track.title} progress: ${stat.solved} of ${stat.total} solved`}
                  tone={done ? "success" : "accent"}
                  size="sm"
                  className="mt-2"
                />
              </Link>
            </Reveal>
          );
        })}
      </ul>
    </section>
  );
}
