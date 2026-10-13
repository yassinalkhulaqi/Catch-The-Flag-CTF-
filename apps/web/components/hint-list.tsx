"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { api, ApiError } from "@/lib/api/client";
import { errorMessage } from "@/lib/errors";
import type { ChallengeHint } from "@/lib/types";

export function HintList({
  challengeId,
  hints,
}: {
  challengeId: number;
  hints: ChallengeHint[];
}) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function unlock(hintId: number) {
    setError(null);
    setPendingId(hintId);
    startTransition(async () => {
      try {
        await api.post(`/challenges/${challengeId}/hints/${hintId}/unlock`);
        router.refresh();
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          router.push("/login");
          return;
        }
        setError(errorMessage(err, "Could not unlock hint."));
      } finally {
        setPendingId(null);
      }
    });
  }

  if (hints.length === 0) {
    return <p className="text-sm text-muted">No hints for this challenge.</p>;
  }

  return (
    <div className="space-y-3">
      {error ? (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}
      <ol className="space-y-3">
        {hints.map((hint) => (
          <li key={hint.id} className="border border-border bg-surface p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-mono text-xs uppercase tracking-wide text-muted">
                Hint {hint.position}
              </p>
              <p className="font-mono text-xs text-faint">−{hint.cost_points} pts</p>
            </div>
            {hint.unlocked && hint.content ? (
              <p className="mt-2 text-sm text-foreground">{hint.content}</p>
            ) : (
              <Button
                className="mt-3"
                variant="outline"
                size="sm"
                disabled={pendingId === hint.id}
                onClick={() => unlock(hint.id)}
              >
                {pendingId === hint.id ? "Unlocking…" : "Unlock hint"}
              </Button>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
