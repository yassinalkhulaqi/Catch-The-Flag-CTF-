import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export interface TrackBadgeTrack {
  name: string;
  solved: number;
  total: number;
}

/**
 * A track counts as awarded when every visible catalog challenge in that
 * track is solved (solved >= total, total > 0). Totals are the visible
 * catalog page the caller passed in — the server remains the source of
 * truth for solves.
 */
export function isTrackBadgeUnlocked(
  track: Pick<TrackBadgeTrack, "solved" | "total">,
): boolean {
  return track.total > 0 && track.solved >= track.total;
}

export function TrackBadges({ tracks }: { tracks: TrackBadgeTrack[] }) {
  if (tracks.length === 0) {
    return <p className="text-sm text-muted">No tracks yet.</p>;
  }

  return (
    <ul aria-label="Vulnerability track badges" className="grid gap-3 sm:grid-cols-2">
      {tracks.map((track) => {
        const solved = Math.max(0, Math.floor(track.solved));
        const total = Math.max(0, Math.floor(track.total));
        const unlocked = isTrackBadgeUnlocked({ solved, total });
        return (
          <li
            key={track.name}
            data-testid="track-badge"
            data-state={unlocked ? "unlocked" : "locked"}
            className={cn(
              "rounded-lg border p-4",
              unlocked
                ? "border-success/40 bg-success/5"
                : "border-border bg-surface",
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="font-semibold text-foreground">{track.name} Master</p>
              <Badge tone={unlocked ? "success" : "neutral"}>
                {unlocked ? "Unlocked" : "Locked"}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-muted">
              {solved} of {total} solved
              {total === 0 ? " · no challenges in catalog" : null}
            </p>
            <Progress
              value={solved}
              max={Math.max(1, total)}
              label={`${track.name} progress: ${solved} of ${total} solved`}
              className="mt-3"
            />
          </li>
        );
      })}
    </ul>
  );
}
