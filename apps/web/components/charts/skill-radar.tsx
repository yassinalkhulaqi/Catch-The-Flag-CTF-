export interface RadarPoint {
  label: string;
  value: number;
  max: number;
}

/**
 * Category shape from solves the API already returned.
 * Values are counts, not a new score.
 */
export function SkillRadar({ points }: { points: RadarPoint[] }) {
  const size = 280;
  const center = size / 2;
  const radius = 96;
  const steps = points.length || 1;
  const polygon = points
    .map((point, index) => {
      const ratio = point.max <= 0 ? 0 : Math.min(1, point.value / point.max);
      return polar(center, radius * ratio, index, steps);
    })
    .join(" ");
  const grid = [0.25, 0.5, 0.75, 1].map((scale) =>
    points.map((_, index) => polar(center, radius * scale, index, steps)).join(" "),
  );

  return (
    <figure>
      <svg viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Solves by discipline" className="mx-auto w-full max-w-xs">
        {grid.map((ring) => (
          <polygon key={ring} points={ring} fill="none" stroke="var(--border)" />
        ))}
        {points.map((point, index) => {
          const [x, y] = polar(center, radius + 18, index, steps).split(",");
          return (
            <text key={point.label} x={x} y={y} textAnchor="middle" fill="var(--muted)" fontSize="11">
              {point.label}
            </text>
          );
        })}
        {points.length > 2 ? <polygon points={polygon} fill="color-mix(in srgb, var(--accent) 28%, transparent)" stroke="var(--accent)" /> : null}
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
