/**
 * Trophy cabinet — presentation-only derivations over `/me/achievements`.
 *
 * The API owns award state and progress. This module only groups, filters,
 * sorts, and summarizes the badges the server already returned; it never
 * infers an award from a local count.
 */

import type { Achievement } from "@/lib/types";

export const CABINET_FILTERS = ["all", "unlocked", "progress", "locked"] as const;
export type CabinetFilter = (typeof CABINET_FILTERS)[number];

export const CABINET_SORTS = ["default", "closest", "recent", "alpha"] as const;
export type CabinetSort = (typeof CABINET_SORTS)[number];

export type CabinetBand = "starter" | "core" | "elite" | "unknown";

export interface CabinetSummary {
  total: number;
  unlocked: number;
  inProgress: number;
  locked: number;
  /** Whole-number completion, 0–100. */
  completion: number;
  closest: Achievement | null;
  latest: Achievement | null;
}

export function achievementRatio(achievement: Achievement): number {
  if (achievement.awarded) return 1;
  const target = achievement.progress?.target ?? 0;
  if (target <= 0) return 0;
  const current = achievement.progress?.current ?? 0;
  return Math.min(1, Math.max(0, current / target));
}

/** A badge the server has not awarded but the learner has started. */
export function isInProgress(achievement: Achievement): boolean {
  return !achievement.awarded && (achievement.progress?.current ?? 0) > 0;
}

/** A badge with no award and no recorded progress. */
export function isLocked(achievement: Achievement): boolean {
  return !achievement.awarded && !isInProgress(achievement);
}

export function filterCabinet(
  items: readonly Achievement[],
  filter: CabinetFilter,
): Achievement[] {
  switch (filter) {
    case "unlocked":
      return items.filter((item) => item.awarded);
    case "progress":
      return items.filter(isInProgress);
    case "locked":
      return items.filter(isLocked);
    default:
      return [...items];
  }
}

export function searchCabinet(
  items: readonly Achievement[],
  query: string,
): Achievement[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [...items];
  return items.filter(
    (item) =>
      item.title.toLowerCase().includes(needle) ||
      item.description.toLowerCase().includes(needle) ||
      item.key.toLowerCase().includes(needle),
  );
}

function awardedTime(achievement: Achievement): number {
  if (!achievement.awarded_at) return 0;
  const time = new Date(achievement.awarded_at).getTime();
  return Number.isNaN(time) ? 0 : time;
}

function byCloseness(a: Achievement, b: Achievement): number {
  const aHasTarget = (a.progress?.target ?? 0) > 0;
  const bHasTarget = (b.progress?.target ?? 0) > 0;
  if (aHasTarget !== bHasTarget) return aHasTarget ? -1 : 1;
  return (
    achievementRatio(b) - achievementRatio(a) ||
    (a.progress?.target ?? 0) - (b.progress?.target ?? 0) ||
    a.id - b.id
  );
}

/**
 * Display ordering. `default` keeps the server's `sort_order`; every other
 * mode is deterministic. Incomplete badges come before awarded ones in
 * `closest`, and awarded badges come first in `recent`.
 */
export function sortCabinet(
  items: readonly Achievement[],
  sort: CabinetSort,
): Achievement[] {
  const sorted = [...items];
  if (sort === "default") return sorted;

  if (sort === "alpha") {
    sorted.sort((a, b) => a.title.localeCompare(b.title) || a.id - b.id);
    return sorted;
  }

  if (sort === "recent") {
    sorted.sort((a, b) => {
      if (Boolean(a.awarded) !== Boolean(b.awarded)) return a.awarded ? -1 : 1;
      return awardedTime(b) - awardedTime(a) || a.id - b.id;
    });
    return sorted;
  }

  sorted.sort((a, b) => {
    if (Boolean(a.awarded) !== Boolean(b.awarded)) return a.awarded ? 1 : -1;
    if (a.awarded && b.awarded) return awardedTime(b) - awardedTime(a) || a.id - b.id;
    return byCloseness(a, b);
  });
  return sorted;
}

export function cabinetSummary(items: readonly Achievement[]): CabinetSummary {
  const unlocked = items.filter((item) => item.awarded).length;
  const inProgress = items.filter(isInProgress).length;
  const locked = items.filter(isLocked).length;
  const total = items.length;

  const closest = items.filter(isInProgress).sort(byCloseness)[0] ?? null;
  const latest =
    items
      .filter((item) => item.awarded)
      .sort((a, b) => awardedTime(b) - awardedTime(a) || b.id - a.id)[0] ?? null;

  return {
    total,
    unlocked,
    inProgress,
    locked,
    completion: total === 0 ? 0 : Math.round((unlocked / total) * 100),
    closest,
    latest,
  };
}

export function targetBand(target: number | undefined): CabinetBand {
  if (!target || target <= 0) return "unknown";
  if (target < 10) return "starter";
  if (target < 50) return "core";
  return "elite";
}

export function nextMilestone(
  achievement: Achievement,
): { current: number; target: number; remaining: number } | null {
  const progress = achievement.progress;
  if (!progress || progress.target <= 0) return null;
  return {
    current: Math.max(0, progress.current),
    target: progress.target,
    remaining: Math.max(0, progress.target - progress.current),
  };
}

/** Award date as a stable `YYYY-MM-DD` string, or null when unknown. */
export function awardedDay(achievement: Achievement): string | null {
  const raw = achievement.awarded_at;
  if (!raw) return null;
  const time = new Date(raw).getTime();
  if (Number.isNaN(time)) return null;
  return new Date(time).toISOString().slice(0, 10);
}
