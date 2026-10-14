export interface RadarPoint {
  label: string;
  value: number;
  max: number;
}

export interface SkillRadarDatum {
  track: string;
  value: number;
}

type SkillRadarProps =
  | { points: RadarPoint[]; data?: never; max?: never }
  | { data: SkillRadarDatum[]; max: number; points?: never };

/**
 * Radar over vulnerability tracks. Values are solved counts derived from
 * already-available solves data — never a new score. Accepts the track
 * shape `{ data: [{ track, value }], max }` and keeps the legacy
 * `{ points: [{ label, value, max }] }` shape for existing callers.
 */
export function SkillRadar(props: SkillRadarProps) {
  const points: RadarPoint[] =
    "data" in props && props.data !== undefined
      ? props.data.map((datum) => ({
          label: datum.track,
          value: datum.value,
          max: props.max,
        }))
      : (props as { points: RadarPoint[] }).points ?? [];

  if (points.length === 0) {
    return <p className="text-sm text-muted">No skill data yet.</p>;
  }

  const size = 280;
  const center = size / 2;
  const radius = 96;
  const steps = points.length || 1;
  const ratios = points.map((point) =>
    point.max <= 0 ? 0 : Math.min(1, Math.max(0, point.value / point.max)),
  );
  const polygon = points
    .map((_, index) => polar(center, radius * ratios[index], index, steps))
    .join(" ");
  const grid = [0.25, 0.5, 0.75, 1].map((scale) =>
    points.map((_, index) => polar(center, radius * scale, index, steps)).join(" "),
  );
  const spokes = points.map((_, index) => polar(center, radius, index, steps));
  const dots = points.map(
    (_, index) => polar(center, radius * ratios[index], index, steps).split(",") as [string, string],
  );

  return (
    <figure>
      <svg
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label="Solves by discipline"
        data-testid="skill-radar"
        className="mx-auto w-full max-w-xs"
      >
        {grid.map((ring) => (
          <polygon key={ring} points={ring} fill="none" stroke="var(--border)" />
        ))}
        {spokes.map((vertex) => {
          const [x, y] = vertex.split(",");
          return (
            <line
              key={`spoke-${vertex}`}
              x1={center}
              y1={center}
              x2={x}
              y2={y}
              stroke="var(--border)"
              strokeWidth={1}
            />
          );
        })}
        {points.map((point, index) => {
          const [x, y] = polar(center, radius + 18, index, steps).split(",");
          return (
            <text
              key={`${point.label}-${index}`}
              x={x}
              y={y}
              textAnchor="middle"
              fill="var(--muted)"
              fontSize="11"
            >
              {point.label}
            </text>
          );
        })}
        {points.length > 2 ? (
          <polygon
            points={polygon}
            fill="color-mix(in srgb, var(--accent) 28%, transparent)"
            stroke="var(--accent)"
            strokeWidth={2}
            data-testid="skill-radar-area"
          />
        ) : null}
        {dots.map(([x, y], index) => (
          <circle
            key={`dot-${points[index].label}-${index}`}
            cx={x}
            cy={y}
            r={3}
            fill="var(--accent)"
            data-testid="skill-radar-point"
          />
        ))}
      </svg>
      <figcaption className="sr-only">
        {points.map((point) => `${point.label} ${point.value} of ${point.max}`).join(", ")}
      </figcaption>
    </figure>
  );
}

function polar(center: number, radius: number, index: number, steps: number): string {
  const angle = -Math.PI / 2 + (index * 2 * Math.PI) / steps;
  const x = center + Math.cos(angle) * radius;
  const y = center + Math.sin(angle) * radius;
  return `${x.toFixed(1)},${y.toFixed(1)}`;
}
