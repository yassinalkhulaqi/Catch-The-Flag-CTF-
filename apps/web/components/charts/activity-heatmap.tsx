import { cn } from "@/lib/utils";

export interface HeatCell {
  date: string;
  count: number;
}

/** 16 weeks ending today, built from real XP ledger timestamps. */
export function ActivityHeatmap({
  cells,
  label = "XP activity",
}: {
  cells: HeatCell[];
  label?: string;
}) {
  const counts = new Map(cells.map((cell) => [cell.date, cell.count]));
  const days = lastDays(16 * 7);
  const max = Math.max(1, ...days.map((day) => counts.get(day) ?? 0));
  const weeks: string[][] = [];
  for (let index = 0; index < days.length; index += 7) weeks.push(days.slice(index, index + 7));

  return (
    <div>
      <p className="type-eyebrow text-accent">{label}</p>
      <div className="mt-3 flex gap-1" role="img" aria-label={describe(days, counts)}>
        {weeks.map((week, weekIndex) => (
          <div key={week[0] ?? weekIndex} className="grid gap-1">
            {week.map((day) => {
              const count = counts.get(day) ?? 0;
              const level = count === 0 ? 0 : Math.ceil((count / max) * 4);
              return (
                <span
                  key={day}
                  title={`${day}: ${count}`}
                  className={cn("size-3 rounded-[2px]", tone(level))}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

export function heatmapFromTimestamps(stamps: string[], now = new Date()): HeatCell[] {
  const counts = new Map<string, number>();
  for (const stamp of stamps) {
    const date = new Date(stamp);
    if (Number.isNaN(date.getTime())) continue;
    const key = isoDay(date);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  void now;
  return [...counts.entries()].map(([date, count]) => ({ date, count }));
}

function lastDays(total: number, now = new Date()): string[] {
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const startWeekday = end.getUTCDay();
  const aligned = new Date(end);
  aligned.setUTCDate(end.getUTCDate() - startWeekday - (16 * 7 - 7));
  const days: string[] = [];
  for (let index = 0; index < total; index += 1) {
    const day = new Date(aligned);
    day.setUTCDate(aligned.getUTCDate() + index);
    days.push(isoDay(day));
  }
  return days;
}

function isoDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function tone(level: number): string {
  if (level <= 0) return "bg-surface-raised";
  if (level === 1) return "bg-accent/30";
  if (level === 2) return "bg-accent/50";
  if (level === 3) return "bg-accent/75";
  return "bg-accent";
}

function describe(days: string[], counts: Map<string, number>): string {
  const active = days.filter((day) => (counts.get(day) ?? 0) > 0).length;
  return `${active} active days in the last 16 weeks`;
}
