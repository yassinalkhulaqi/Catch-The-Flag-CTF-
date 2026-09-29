/** Human-readable byte size. */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Build a same-origin BFF download path (never call Laravel from the browser). */
export function challengeFilePath(challengeId: number, fileId: number): string {
  return `/api/v1/challenges/${challengeId}/files/${fileId}`;
}

/** Safe query-string builder. */
export function toQuery(params: Record<string, string | number | undefined | null>): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "") continue;
    q.set(k, String(v));
  }
  const s = q.toString();
  return s ? `?${s}` : "";
}

export const DIFFICULTIES = [
  "beginner",
  "intermediate",
  "advanced",
  "expert",
] as const;

export function difficultyLabel(d: string): string {
  return d.charAt(0).toUpperCase() + d.slice(1);
}
