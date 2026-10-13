"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ApiError, api } from "@/lib/api/client";
import type { ChallengeHint } from "@/lib/types";

interface HintUnlockResponse {
  data: {
    hint: { id: number; content: string };
    points_remaining: number;
  };
}

/**
 * Hint unlock island for the challenge detail page.
 * Locked hints require an inline confirmation (never window.confirm) before
 * POSTing through the same-origin BFF. Unlocking is idempotent: once content
 * is known it renders directly and no further requests are made.
 */
export function HintUnlockButton({
  challengeId,
  hint,
}: {
  challengeId: number;
  hint: ChallengeHint;
}) {
  const router = useRouter();
  const [unlocked, setUnlocked] = useState(hint.unlocked);
  const [content, setContent] = useState<string | null>(
    hint.content ?? null,
  );
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Idempotent: once content is known, show it — never POST again.
  if (unlocked && content) {
    return <p className="mt-2 text-sm text-foreground">{content}</p>;
  }

  async function unlock() {
    setPending(true);
    setError(null);
    try {
      const res = await api.post<HintUnlockResponse>(
        `/challenges/${challengeId}/hints/${hint.id}/unlock`,
      );
      setContent(res.data.hint.content);
      setUnlocked(true);
      setConfirming(false);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Could not unlock this hint. Try again.",
      );
    } finally {
      setPending(false);
    }
  }

  const costLabel =
    hint.cost_points > 0 ? `(${hint.cost_points} pts)` : "(free)";

  return (
    <div className="mt-2 space-y-2" aria-live="polite">
      <p className="text-sm text-faint">
        Locked — unlock this hint to reveal its content{" "}
        {hint.cost_points > 0
          ? `(${hint.cost_points} pts will be deducted from the solve value).`
          : "."}
      </p>
      {confirming ? (
        <div className="rounded-md border border-border bg-surface-raised p-3">
          <p className="text-sm text-foreground">
            Unlock Hint {hint.position} {costLabel}? This will reduce the solve
            value.
          </p>
          <div className="mt-2 flex gap-2">
            <Button size="sm" disabled={pending} onClick={unlock}>
              {pending ? "Unlocking…" : "Confirm unlock"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={pending}
              onClick={() => {
                setConfirming(false);
                setError(null);
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setConfirming(true);
            setError(null);
          }}
        >
          Unlock hint {costLabel}
        </Button>
      )}
      {error ? (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
