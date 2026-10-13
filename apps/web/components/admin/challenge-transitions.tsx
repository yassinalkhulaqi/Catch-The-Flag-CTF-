"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  ADMIN_STATUSES,
  transitionAdminChallenge,
  type AdminChallengeTransition,
} from "@/lib/api/admin";
import type { ContentStatus } from "@/lib/types";

const ACTIONS: Array<{
  action: AdminChallengeTransition;
  label: string;
  hint: string;
}> = [
  { action: "review", label: "Send to review", hint: "Draft → review" },
  { action: "publish", label: "Publish", hint: "Visible to learners" },
  { action: "unpublish", label: "Unpublish", hint: "Hidden, keeps solves" },
  { action: "archive", label: "Archive", hint: "Retired from listings" },
];

/** Lifecycle transition buttons. Each POSTs to its own endpoint. */
export function ChallengeTransitions({
  challengeId,
  status,
}: {
  challengeId: number;
  status: ContentStatus;
}) {
  const router = useRouter();
  const [pending, setPending] = useState<AdminChallengeTransition | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [current, setCurrent] = useState<ContentStatus>(status);

  async function run(action: AdminChallengeTransition) {
    if (pending) return;
    setPending(action);
    setError(null);
    const result = await transitionAdminChallenge(challengeId, action);
    setPending(null);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    if (ADMIN_STATUSES.includes(result.data.status)) {
      setCurrent(result.data.status);
    }
    router.refresh();
  }

  return (
    <div>
      <p className="text-sm text-muted">
        Current status:{" "}
        <span className="font-mono text-xs uppercase text-foreground">
          {current}
        </span>
      </p>
      {error ? (
        <p role="alert" className="mt-2 text-sm text-danger">
          {error}
        </p>
      ) : null}
      <div className="mt-3 flex flex-wrap gap-2">
        {ACTIONS.map(({ action, label, hint }) => (
          <Button
            key={action}
            variant={action === "archive" ? "danger" : "secondary"}
            size="sm"
            disabled={pending !== null}
            title={hint}
            onClick={() => run(action)}
          >
            {pending === action ? "Working…" : label}
          </Button>
        ))}
      </div>
    </div>
  );
}
