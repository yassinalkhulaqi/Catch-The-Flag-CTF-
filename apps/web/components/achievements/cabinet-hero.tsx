import { Award, Lock, Sparkles, Trophy } from "lucide-react";
import { AchievementIcon } from "@/components/achievements/achievement-icon";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { Dictionary } from "@/lib/i18n/en";
import {
  awardedDay,
  nextMilestone,
  type CabinetSummary,
} from "@/lib/achievements/cabinet";
import { ProgressRing } from "@/lib/motion/progress-ring";
import { formatXp } from "@/lib/utils";

export function CabinetHero({
  copy,
  summary,
}: {
  copy: Dictionary["achievements"];
  summary: CabinetSummary;
}) {
  const stats = [
    { label: copy.unlocked, value: summary.unlocked, icon: Trophy, tone: "text-success" },
    { label: copy.inProgress, value: summary.inProgress, icon: Sparkles, tone: "text-accent" },
    { label: copy.locked, value: summary.locked, icon: Lock, tone: "text-faint" },
  ] as const;

  const latestDay = summary.latest ? awardedDay(summary.latest) : null;
  const milestone = summary.closest ? nextMilestone(summary.closest) : null;

  return (
    <section
      aria-labelledby="cabinet-title"
      className="relative overflow-hidden rounded-2xl border border-border bg-surface/60"
    >
      <div
        aria-hidden="true"
        className="aurora pointer-events-none absolute inset-0 opacity-60"
      />
      <div className="relative grid gap-8 p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div className="max-w-2xl">
          <p className="type-eyebrow text-accent">{copy.eyebrow}</p>
          <h1 id="cabinet-title" className="type-title mt-2 text-balance">
            {copy.title}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted sm:text-base">
            {copy.description}
          </p>

          <dl className="mt-6 grid max-w-lg grid-cols-3 gap-2">
            {stats.map(({ label, value, icon: Icon, tone }) => (
              <div
                key={label}
                className="rounded-xl border border-border/80 bg-background/40 px-3 py-2.5"
              >
                <dt className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wide text-faint">
                  <Icon aria-hidden="true" className={`size-3 ${tone}`} />
                  <span className="truncate">{label}</span>
                </dt>
                <dd className="mt-1 font-display text-xl font-semibold tabular-nums">
                  {formatXp(value)}
                </dd>
              </div>
            ))}
          </dl>

          {summary.latest ? (
            <p className="mt-4 flex flex-wrap items-center gap-2 text-xs text-faint">
              <Trophy aria-hidden="true" className="size-3.5 text-warning" />
              {copy.latest}: <span className="text-foreground">{summary.latest.title}</span>
              {latestDay ? (
                <span className="font-mono" data-testid="latest-award-day">
                  {latestDay}
                </span>
              ) : null}
            </p>
          ) : null}
        </div>

        <div className="flex items-center gap-4">
          <ProgressRing
            ratio={summary.completion / 100}
            label={`${copy.completion}: ${summary.completion}%`}
            center={
              <>
                <span className="block font-display text-2xl font-semibold tabular-nums">
                  {summary.completion}%
                </span>
                <span className="mt-0.5 block font-mono text-[9px] uppercase tracking-wide text-faint">
                  {copy.completion}
                </span>
              </>
            }
          />
          <div className="space-y-1.5 text-xs">
            <p className="font-mono uppercase tracking-wide text-faint">{copy.total}</p>
            <p className="font-display text-3xl font-semibold tabular-nums">
              {formatXp(summary.unlocked)}
              <span className="text-base text-faint">/{formatXp(summary.total)}</span>
            </p>
            <Badge tone="accent">{summary.completion}%</Badge>
          </div>
        </div>
      </div>

      <div className="relative border-t border-border/70 bg-background/20 px-6 py-4 sm:px-8">
        {summary.closest && milestone ? (
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl border border-accent/30 bg-accent/10">
              <AchievementIcon
                icon={summary.closest.icon}
                className="size-5 text-accent"
              />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-mono text-[10px] uppercase tracking-wide text-accent">
                {copy.closest}
              </p>
              <p className="truncate text-sm font-medium text-foreground">
                {summary.closest.title}
              </p>
              <p className="text-[11px] text-faint">{copy.closestBody}</p>
            </div>
            <div className="w-full sm:w-64">
              <Progress
                value={milestone.current}
                max={milestone.target}
                size="sm"
                label={`${summary.closest.title} ${copy.progress}`}
              />
              <p className="mt-1.5 text-right font-mono text-[11px] text-faint">
                {formatXp(milestone.current)} / {formatXp(milestone.target)} ·{" "}
                {formatXp(milestone.remaining)} {copy.toGo}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <span className="inline-flex size-10 items-center justify-center rounded-xl border border-success/30 bg-success/10">
              <Award aria-hidden="true" className="size-5 text-success" />
            </span>
            <div>
              <p className="text-sm font-semibold text-success">{copy.allDone}</p>
              <p className="text-xs text-muted">{copy.allDoneBody}</p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
