import { Check, ChevronRight, Lock } from "lucide-react";
import { AchievementIcon } from "@/components/achievements/achievement-icon";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  awardedDay,
  isInProgress,
  nextMilestone,
  targetBand,
  type CabinetBand,
} from "@/lib/achievements/cabinet";
import type { Dictionary } from "@/lib/i18n/en";
import { cn, formatXp } from "@/lib/utils";
import type { Achievement } from "@/lib/types";

function bandLabel(band: CabinetBand, copy: Dictionary["achievements"]): string {
  switch (band) {
    case "starter":
      return copy.bandStarter;
    case "core":
      return copy.bandCore;
    case "elite":
      return copy.bandElite;
    default:
      return copy.bandUnknown;
  }
}

export function TrophyTile({
  achievement,
  copy,
  onOpen,
}: {
  achievement: Achievement;
  copy: Dictionary["achievements"];
  onOpen: (achievement: Achievement) => void;
}) {
  const awarded = Boolean(achievement.awarded);
  const started = isInProgress(achievement);
  const milestone = awarded ? null : nextMilestone(achievement);
  const day = awardedDay(achievement);

  return (
    <li>
      <button
        type="button"
        onClick={() => onOpen(achievement)}
        aria-label={`${copy.openBadge}: ${achievement.title}`}
        className={cn(
          "group relative flex h-full w-full flex-col overflow-hidden rounded-2xl border p-4 text-start",
          "transition-[border-color,background-color,box-shadow,transform] duration-200",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          "hover:-translate-y-0.5 hover:shadow-[var(--shadow-float)] motion-reduce:hover:translate-y-0",
          awarded
            ? "border-accent/40 bg-accent/[0.06]"
            : started
              ? "border-border bg-surface hover:border-accent/40"
              : "border-border bg-surface/70 hover:border-border-strong",
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            "absolute inset-x-0 top-0 h-0.5 transition-opacity",
            awarded
              ? "bg-[image:var(--accent-gradient)] opacity-100"
              : "bg-[image:var(--accent-gradient)] opacity-0 group-hover:opacity-60",
          )}
        />

        <div className="flex items-start justify-between gap-2">
          <span
            className={cn(
              "inline-flex size-11 shrink-0 items-center justify-center rounded-xl border",
              awarded
                ? "border-accent/40 bg-accent/10 text-accent"
                : started
                  ? "border-border bg-surface-raised text-foreground"
                  : "border-border bg-surface-raised text-faint",
            )}
          >
            <AchievementIcon icon={achievement.icon} className="size-5" />
          </span>
          {awarded ? (
            <Badge tone="success" dot>
              {copy.unlocked}
            </Badge>
          ) : started ? (
            <Badge tone="accent" dot>
              {copy.inProgress}
            </Badge>
          ) : (
            <Badge tone="neutral">
              <Lock aria-hidden="true" className="size-3" />
              {copy.locked}
            </Badge>
          )}
        </div>

        <h2 className="mt-3 text-sm font-semibold text-foreground">{achievement.title}</h2>
        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted">
          {achievement.description}
        </p>

        {milestone ? (
          <div className="mt-3">
            <Progress
              value={milestone.current}
              max={milestone.target}
              size="sm"
              label={`${achievement.title} ${copy.progress}`}
            />
            <div className="mt-1.5 flex items-center justify-between gap-2 font-mono text-[10px] text-faint">
              <span>
                {formatXp(milestone.current)} / {formatXp(milestone.target)}
              </span>
              <span>
                {formatXp(milestone.remaining)} {copy.toGo}
              </span>
            </div>
          </div>
        ) : awarded ? (
          <p className="mt-3 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wide text-success">
            <Check aria-hidden="true" className="size-3" />
            {day ? `${copy.awardedOn} ${day}` : copy.unlocked}
          </p>
        ) : null}

        <div className="mt-auto flex items-center justify-between gap-2 border-t border-border/70 pt-2.5 font-mono text-[9px] uppercase tracking-wide text-faint">
          <span className="truncate">{bandLabel(targetBand(achievement.progress?.target), copy)}</span>
          <ChevronRight
            aria-hidden="true"
            className="size-3.5 shrink-0 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
          />
        </div>
      </button>
    </li>
  );
}
