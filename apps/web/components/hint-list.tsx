"use client";

import { Lightbulb, LockKeyhole, Unlock } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api, ApiError } from "@/lib/api/client";
import { errorMessage } from "@/lib/errors";
import { cn } from "@/lib/utils";
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
          <li
            key={hint.id}
            className={cn(
              "relative overflow-hidden rounded-xl border p-4 transition-colors",
              hint.unlocked
                ? "border-success/30 bg-success/5"
                : "border-border bg-surface hover:border-border-strong",
            )}
          >
            {hint.unlocked ? (
              <span
                aria-hidden="true"
                className="absolute inset-x-0 top-0 h-0.5 bg-success/60"
              />
            ) : null}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-wide text-muted">
                {hint.unlocked ? (
                  <Lightbulb aria-hidden="true" className="size-3.5 text-success" />
                ) : (
                  <LockKeyhole aria-hidden="true" className="size-3.5 text-faint" />
                )}
                Hint {hint.position}
              </p>
              <Badge tone={hint.unlocked ? "success" : "neutral"} className="normal-case">
                −{hint.cost_points} pts
              </Badge>
            </div>
            {hint.unlocked && hint.content ? (
              <div className="mt-3 rounded-lg border border-success/20 bg-background/50 px-3 py-2.5">
                <p className="text-sm leading-relaxed text-foreground">{hint.content}</p>
              </div>
            ) : (
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-muted">Unlocking spends points from this lab.</p>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pendingId === hint.id}
                  onClick={() => unlock(hint.id)}
                  className="gap-1.5"
                >
                  <Unlock aria-hidden="true" className="size-3.5" />
                  {pendingId === hint.id ? "Unlocking…" : "Unlock hint"}
                </Button>
              </div>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
