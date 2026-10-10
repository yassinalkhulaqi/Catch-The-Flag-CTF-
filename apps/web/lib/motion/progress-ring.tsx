"use client";

import { usePrefersReducedMotion } from "@/lib/motion/reduced";

const SIZE = 112;
const STROKE = 8;
const RADIUS = (SIZE - STROKE) / 2;
const CIRC = 2 * Math.PI * RADIUS;

/** XP ring. The number is server XP; the ring only draws the ratio. */
export function ProgressRing({
  ratio,
  label,
  center,
}: {
  ratio: number;
  label: string;
  center: React.ReactNode;
}) {
  const reduced = usePrefersReducedMotion();
  const clamped = Math.min(1, Math.max(0, ratio));
  const offset = CIRC * (1 - clamped);

  return (
    <div className="relative grid size-28 place-items-center" role="img" aria-label={label}>
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="absolute -rotate-90" aria-hidden="true">
        <circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} fill="none" stroke="var(--border)" strokeWidth={STROKE} />
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRC}
          strokeDashoffset={offset}
          style={{ transition: reduced ? "none" : "stroke-dashoffset 700ms cubic-bezier(0.16, 1, 0.3, 1)" }}
        />
      </svg>
      <div className="text-center">{center}</div>
    </div>
  );
}
