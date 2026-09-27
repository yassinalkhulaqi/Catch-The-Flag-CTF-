/**
 * Shared client helpers. No API calls here — see lib/api/*.
 */

/** Class name joiner (dependency-free). */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

/** Format XP with thin thousands separators. */
export function formatXp(xp: number): string {
  return new Intl.NumberFormat("en-US").format(xp);
}

/** Relative time like "3h ago" for timelines. */
export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}
