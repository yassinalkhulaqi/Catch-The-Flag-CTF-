/**
 * Presentation-only level curve. The server owns XP. This function never
 * writes a score; it only describes how far the current XP sits inside a
 * fixed public curve so the dashboard can draw a ring.
 *
 * Curve: level n starts at 100 * (n - 1) * n / 2  (0, 100, 300, 600, 1000…).
 * Level 1 is 0–99 XP. There is no maximum level.
 */

export interface LevelProgress {
  level: number;
  floor: number;
  next: number;
  into: number;
  span: number;
  ratio: number;
}

export function levelFromXp(xp: number): LevelProgress {
  const safe = Number.isFinite(xp) ? Math.max(0, Math.floor(xp)) : 0;
  let level = 1;
  while (thresholdForLevel(level + 1) <= safe) {
    level += 1;
    if (level > 500) break;
  }
  const floor = thresholdForLevel(level);
  const next = thresholdForLevel(level + 1);
  const span = next - floor;
  const into = safe - floor;
  return {
    level,
    floor,
    next,
    into,
    span,
    ratio: span === 0 ? 0 : into / span,
  };
}

function thresholdForLevel(level: number): number {
  const n = Math.max(1, level);
  return (100 * (n - 1) * n) / 2;
}
