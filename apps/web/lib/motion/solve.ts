/**
 * Choreography for a correct flag. The caller already has the server result.
 * This function never decides correctness and never invents points.
 */

export interface SolveOrigin {
  x: number;
  y: number;
}

export interface SolvePlan {
  /** Points from the server response, floored at 0. */
  points: number;
  /** True only when a burst was started. */
  celebrate: boolean;
  cancel: () => void;
}

type Burst = (origin: SolveOrigin) => () => void;

export async function playSolve(input: {
  origin: SolveOrigin | null;
  points: number;
  alreadySolved?: boolean;
  reduced?: boolean;
  burst?: Burst;
}): Promise<SolvePlan> {
  const points = Number.isFinite(input.points) ? Math.max(0, Math.floor(input.points)) : 0;
  const origin = input.origin;
  if (input.alreadySolved || input.reduced || !origin) {
    return { points, celebrate: false, cancel: () => undefined };
  }
  const burst = input.burst ?? (await import("@/lib/motion/confetti")).burstConfetti;
  const cancel = burst(origin);
  return { points, celebrate: true, cancel };
}
