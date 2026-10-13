import type { AdminStats } from "@/lib/types";

const BARS: Array<{ key: keyof AdminStats; label: string }> = [
  { key: "users", label: "Users" },
  { key: "challenges_published", label: "Challenges live" },
  { key: "challenges_draft", label: "Challenges draft" },
  { key: "paths_published", label: "Paths live" },
  { key: "paths_draft", label: "Paths draft" },
  { key: "solves_total", label: "Solves" },
  { key: "users_banned", label: "Banned" },
];

/** Bars from `/admin/stats` only. No invented time series. */
export function StatsChart({ stats }: { stats: AdminStats }) {
  const values = BARS.map((bar) => Number(stats[bar.key] ?? 0));
  const max = Math.max(1, ...values);

  return (
    <figure className="rounded-xl border border-border bg-surface p-4">
      <figcaption className="type-eyebrow text-accent">Counts from the admin stats endpoint</figcaption>
      <ul className="mt-4 space-y-3">
        {BARS.map((bar, index) => {
          const value = values[index] ?? 0;
          return (
            <li key={bar.key}>
              <div className="mb-1 flex justify-between text-sm">
                <span>{bar.label}</span>
                <span className="font-mono text-xs text-muted">{value}</span>
              </div>
              <div className="h-2 rounded-full bg-surface-raised" role="img" aria-label={`${bar.label} ${value}`}>
                <div className="h-full rounded-full bg-accent" style={{ width: `${(value / max) * 100}%` }} />
              </div>
            </li>
          );
        })}
      </ul>
    </figure>
  );
}
