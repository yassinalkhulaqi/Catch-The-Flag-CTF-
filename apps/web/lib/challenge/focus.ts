/**
 * Challenge focus mode — presentation-only helpers.
 *
 * Focus mode never changes the challenge, solve state, or XP. It keeps a
 * local review checklist and an elapsed session timer on this device, and
 * provides stable section ids for in-page navigation.
 */

export const FOCUS_SECTIONS = [
  "status",
  "objective",
  "briefing",
  "artifacts",
  "submit",
  "hints",
  "files",
  "walkthrough",
] as const;

export type FocusSectionKey = (typeof FOCUS_SECTIONS)[number];

export interface FocusSection {
  key: FocusSectionKey;
  id: string;
  label: string;
}

export interface FocusFlags {
  authenticated: boolean;
  hasFiles: boolean;
  hasHints: boolean;
  hasWalkthrough: boolean;
}

export function sectionDomId(key: FocusSectionKey): string {
  return `focus-${key}`;
}

/** Sections actually rendered on this challenge, in page order. */
export function focusSections(
  flags: FocusFlags,
  labels: Record<FocusSectionKey, string>,
): FocusSection[] {
  return FOCUS_SECTIONS.filter((key) => key !== "walkthrough" || flags.hasWalkthrough).map(
    (key) => ({ key, id: sectionDomId(key), label: labels[key] }),
  );
}

export function focusProgress(
  completed: readonly string[],
  sections: readonly FocusSection[],
): { count: number; total: number; percent: number } {
  const keys = new Set<string>(sections.map((section) => section.key));
  const count = new Set(completed.filter((key) => keys.has(key))).size;
  const total = sections.length;
  return {
    count,
    total,
    percent: total === 0 ? 0 : Math.round((count / total) * 100),
  };
}

export function parseChecklist(raw: string | null): string[] {
  if (!raw) return [];
  return raw
    .split("|")
    .map((key) => key.trim())
    .filter(Boolean);
}

export function serializeChecklist(keys: readonly string[]): string {
  return keys.join("|");
}

export function toggleChecklist(keys: readonly string[], key: string): string[] {
  return keys.includes(key) ? keys.filter((item) => item !== key) : [...keys, key];
}

/** Elapsed time as `MM:SS`, or `H:MM:SS` after an hour. */
export function formatElapsed(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const seconds = safe % 60;
  const minutes = Math.floor(safe / 60) % 60;
  const hours = Math.floor(safe / 3600);
  const pad = (value: number) => value.toString().padStart(2, "0");
  return hours > 0
    ? `${hours}:${pad(minutes)}:${pad(seconds)}`
    : `${pad(minutes)}:${pad(seconds)}`;
}
