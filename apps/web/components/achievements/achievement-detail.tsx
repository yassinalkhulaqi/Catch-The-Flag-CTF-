import { Check, Lock, Sparkles } from "lucide-react";
import { AchievementIcon } from "@/components/achievements/achievement-icon";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
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

export function AchievementDetail({
  achievement,
  copy,
  onClose,
}: {
  achievement: Achievement | null;
  copy: Dictionary["achievements"];
  onClose: () => void;
}) {
  const awarded = Boolean(achievement?.awarded);
  const started = achievement ? isInProgress(achievement) : false;
  const milestone = achievement && !awarded ? nextMilestone(achievement) : null;
  const day = achievement ? awardedDay(achievement) : null;

  return (
    <Dialog
      open={achievement !== null}
      onClose={onClose}
      title={achievement?.title ?? copy.details}
      className="max-w-md"
    >
      {achievement ? (
        <div>
          <div className="flex items-center gap-3">
            <span
              className={cn(
                "inline-flex size-14 shrink-0 items-center justify-center rounded-2xl border",
                awarded
                  ? "border-accent/40 bg-accent/10 text-accent"
                  : "border-border bg-surface-raised text-faint",
              )}
            >
              <AchievementIcon icon={achievement.icon} className="size-7" />
            </span>
            <div className="min-w-0">
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
              <p className="mt-2 font-mono text-[10px] uppercase tracking-wide text-faint">
                {achievement.key}
              </p>
            </div>
          </div>

          <p className="mt-4 text-sm leading-relaxed text-muted">
            {achievement.description}
          </p>

          {milestone ? (
            <div className="mt-4 rounded-xl border border-border bg-background/40 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wide text-faint">
                  <Sparkles aria-hidden="true" className="size-3 text-accent" />
                  {copy.progress}
                </p>
                <p className="font-mono text-xs text-foreground">
                  {formatXp(milestone.current)} / {formatXp(milestone.target)}
                </p>
              </div>
              <Progress
                value={milestone.current}
                max={milestone.target}
                size="sm"
                label={`${achievement.title} ${copy.progress}`}
                className="mt-2.5"
              />
              <p className="mt-2 text-right font-mono text-[11px] text-faint">
                {formatXp(milestone.remaining)} {copy.toGo}
              </p>
            </div>
          ) : null}

          <dl className="mt-4 grid grid-cols-2 gap-2 border-t border-border pt-3 text-xs">
            <div>
              <dt className="font-mono text-[10px] uppercase tracking-wide text-faint">
                {copy.target}
              </dt>
              <dd className="mt-0.5 text-foreground">
                {achievement.progress?.target
                  ? formatXp(achievement.progress.target)
                  : copy.bandUnknown}
              </dd>
            </div>
            <div>
              <dt className="font-mono text-[10px] uppercase tracking-wide text-faint">
                {copy.status}
              </dt>
              <dd className="mt-0.5 text-foreground">
                {bandLabel(targetBand(achievement.progress?.target), copy)}
              </dd>
            </div>
            <div className="col-span-2">
              <dt className="font-mono text-[10px] uppercase tracking-wide text-faint">
                {copy.awardedOn}
              </dt>
              <dd className="mt-0.5 flex items-center gap-1.5 text-foreground">
                {day ? (
                  <>
                    <Check aria-hidden="true" className="size-3 text-success" />
                    <span className="font-mono">{day}</span>
                  </>
                ) : (
                  copy.notAwarded
                )}
              </dd>
            </div>
          </dl>
        </div>
      ) : null}
    </Dialog>
  );
}
