/**
 * Leaderboard arena — presentation-only derivations.
 *
 * The API returns entries already ranked by the server
 * (`xp DESC, solved_count DESC, id ASC`). Nothing in this module computes
 * rank, XP, or solve status; it only re-orders, filters, and summarizes the
 * rows the server sent so the board can be browsed without inventing data.
 */

import type { LeaderboardEntry } from "@/lib/types";

export const ARENA_SORTS = ["xp", "solves", "achievements"] as const;
export type ArenaSort = (typeof ARENA_SORTS)[number];

export const ARENA_SCOPES = ["all", "top", "around"] as const;
export type ArenaScope = (typeof ARENA_SCOPES)[number];

export type ArenaDirection = "asc" | "desc";

export interface ArenaStats {
  players: number;
  totalXp: number;
  totalSolves: number;
  totalAchievements: number;
  averageXp: number;
  averageSolves: number;
  leaderXp: number;
  leaderSolves: number;
}

export interface ArenaRival<Entry extends LeaderboardEntry = LeaderboardEntry> {
  entry: Entry;
  above: Entry | null;
  below: Entry | null;
  /** XP needed to reach the row directly above. 0 for the leader. */
  gapToAbove: number;
  /** XP cushion over the row directly below. 0 for the last row. */
  gapToBelow: number;
}

function byXp(a: LeaderboardEntry, b: LeaderboardEntry): number {
  return b.xp - a.xp || b.solved_count - a.solved_count || a.id - b.id;
}

function bySolves(a: LeaderboardEntry, b: LeaderboardEntry): number {
  return b.solved_count - a.solved_count || b.xp - a.xp || a.id - b.id;
}

function byAchievements(a: LeaderboardEntry, b: LeaderboardEntry): number {
  return (
    b.achievements_count - a.achievements_count ||
    b.xp - a.xp ||
    a.id - b.id
  );
}

/**
 * Deterministic ordering for a display column. Ties fall back to the other
 * metric and finally to the account id, mirroring the server's tie-break so
 * the board never jumps between renders.
 */
export function sortBoard(
  entries: readonly LeaderboardEntry[],
  sort: ArenaSort = "xp",
  direction: ArenaDirection = "desc",
): LeaderboardEntry[] {
  const sorted = [...entries];
  const compare =
    sort === "solves" ? bySolves : sort === "achievements" ? byAchievements : byXp;
  sorted.sort(compare);
  return direction === "asc" ? sorted.reverse() : sorted;
}

export function searchBoard(
  entries: readonly LeaderboardEntry[],
  query: string,
): LeaderboardEntry[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [...entries];
  return entries.filter((entry) => entry.name.toLowerCase().includes(needle));
}

/**
 * `top` keeps the ten highest server ranks. `around` keeps a five-above /
 * five-below window centred on the viewer; when the viewer is not part of the
 * loaded rows (for example a rank beyond the requested page) the whole board
 * is returned so the control never produces a blank state silently.
 */
export function scopeBoard(
  entries: readonly LeaderboardEntry[],
  scope: ArenaScope,
  viewerId?: number,
): LeaderboardEntry[] {
  if (scope === "top") return entries.slice(0, 10);
  if (scope !== "around" || viewerId === undefined) return [...entries];

  const index = entries.findIndex((entry) => entry.id === viewerId);
  if (index === -1) return [...entries];

  const start = Math.max(0, index - 5);
  const end = Math.min(entries.length, index + 6);
  return entries.slice(start, end);
}

export function boardStats(entries: readonly LeaderboardEntry[]): ArenaStats {
  const players = entries.length;
  const totalXp = entries.reduce((sum, entry) => sum + entry.xp, 0);
  const totalSolves = entries.reduce((sum, entry) => sum + entry.solved_count, 0);
  const totalAchievements = entries.reduce(
    (sum, entry) => sum + entry.achievements_count,
    0,
  );
  const leader = entries[0];

  return {
    players,
    totalXp,
    totalSolves,
    totalAchievements,
    averageXp: players === 0 ? 0 : Math.round(totalXp / players),
    averageSolves: players === 0 ? 0 : Math.round(totalSolves / players),
    leaderXp: leader?.xp ?? 0,
    leaderSolves: leader?.solved_count ?? 0,
  };
}

export function findRival(
  entries: readonly LeaderboardEntry[],
  viewerId: number,
): ArenaRival | null {
  const index = entries.findIndex((entry) => entry.id === viewerId);
  if (index === -1) return null;

  const entry = entries[index];
  const above = index > 0 ? entries[index - 1] : null;
  const below = index < entries.length - 1 ? entries[index + 1] : null;

  return {
    entry,
    above,
    below,
    gapToAbove: above ? Math.max(0, above.xp - entry.xp) : 0,
    gapToBelow: below ? Math.max(0, entry.xp - below.xp) : 0,
  };
}

/** XP earned per recorded solve, rounded for display. 0 when nothing is solved. */
export function xpPerSolve(entry: LeaderboardEntry): number {
  return entry.solved_count > 0
    ? Math.round(entry.xp / entry.solved_count)
    : 0;
}

/**
 * Coarse rank bands used as labels only. They describe position on the board,
 * not a server permission or a hidden rating.
 */
export function rankBand(rank: number): "podium" | "top10" | "top25" | "field" {
  if (rank <= 3) return "podium";
  if (rank <= 10) return "top10";
  if (rank <= 25) return "top25";
  return "field";
}

/** Percentage of the loaded board at or below this rank (1–100). */
export function boardPercentile(rank: number, players: number): number {
  if (players <= 0) return 0;
  return Math.max(1, Math.min(100, Math.round((rank / players) * 100)));
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}
