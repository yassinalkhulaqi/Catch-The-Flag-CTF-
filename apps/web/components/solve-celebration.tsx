"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { FlagSubmitBox } from "@/components/flag-submit-box";
import { CountUp } from "@/lib/motion/count-up";
import { prefersReducedMotion } from "@/lib/motion/reduced";
import { isMuted, playFanfare } from "@/lib/audio";
import type { SubmissionOutcome } from "@/lib/types";

/**
 * Celebration panel mounted when a lab is freshly solved.
 * Plays the fanfare and fires confetti on mount, respecting the existing
 * mute + reduced-motion guards. Never auto-plays for an already-solved lab
 * on page load — it only mounts after a fresh `onSolved` event (or an
 * explicit already-solved render with `animated={false}`).
 */
export function SolveCelebration({
  pointsAwarded,
  xpTotal,
  continueHref = "/challenges",
  animated = true,
}: {
  pointsAwarded: number;
  xpTotal?: number;
  continueHref?: string;
  animated?: boolean;
}) {
  const hostRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!animated) return;
    if (typeof window === "undefined") return;
    // Audio self-guards on mute / reduced-motion / SSR; confetti needs the
    // explicit reduced-motion check.
    if (!isMuted()) playFanfare();
    if (prefersReducedMotion()) return;
    let cleanup: (() => void) | undefined;
    const origin = {
      x: window.innerWidth / 2,
      y: Math.min(window.innerHeight * 0.3, 240),
    };
    void import("@/lib/motion/confetti").then((m) => {
      if (hostRef.current?.isConnected ?? true) {
        cleanup = m.burstConfetti(origin);
      }
    });
    return () => cleanup?.();
  }, [animated]);

  return (
    <section
      ref={hostRef}
      role="status"
      aria-live="polite"
      data-testid="solve-celebration"
      className="animate-pop rounded-xl border border-success/50 bg-success/10 p-5 shadow-[var(--glow-success)] motion-reduce:animate-none"
    >
      <h2 className="type-eyebrow text-success">Lab solved</h2>
      <p className="mt-2 text-sm text-foreground">
        Excellent work — flag accepted.{" "}
        <span className="font-mono text-success" data-testid="solve-celebration-xp">
          +<CountUp value={pointsAwarded} /> XP
        </span>
        {typeof xpTotal === "number" ? (
          <span className="text-muted"> · {xpTotal} XP total</span>
        ) : null}
      </p>
      <Link
        href={continueHref}
        data-testid="solve-celebration-continue"
        className="mt-3 inline-flex h-9 items-center rounded-md bg-success px-4 text-sm font-medium text-success-foreground hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        Continue
      </Link>
    </section>
  );
}

/**
 * Client wiring for the lab solve flow: flag submission + celebration.
 * Exists because a Server Component page cannot pass an `onSolved` callback
 * to the client `FlagSubmitBox` — this island owns that state instead.
 */
export function LabSolveSection({
  challengeId,
  alreadySolved = false,
  pointsRemaining,
  continueHref = "/challenges",
}: {
  challengeId: number;
  alreadySolved?: boolean;
  pointsRemaining?: number;
  continueHref?: string;
}) {
  const [freshSolve, setFreshSolve] = useState<SubmissionOutcome | null>(null);

  function handleSolved(outcome: SubmissionOutcome) {
    if (outcome.result === "correct" && !outcome.already_solved) {
      setFreshSolve(outcome);
    }
  }

  return (
    <div className="space-y-3" data-testid="lab-solve-section">
      <FlagSubmitBox
        challengeId={challengeId}
        alreadySolved={alreadySolved}
        pointsRemaining={pointsRemaining}
        onSolved={handleSolved}
      />
      {freshSolve?.result === "correct" ? (
        <SolveCelebration
          pointsAwarded={freshSolve.points_awarded ?? 0}
          xpTotal={freshSolve.xp_total}
          continueHref={continueHref}
        />
      ) : null}
    </div>
  );
}
