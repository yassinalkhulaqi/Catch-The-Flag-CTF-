"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  transitionAdminChallenge,
  transitionAdminPath,
} from "@/lib/api/admin";

/**
 * Approve (publish) or request changes (back to draft) for an item in the
 * review queue. Both are the existing transition endpoints — no new writes,
 * and the audit trail stays uniform.
 */
export function ReviewQueueActions({
  kind,
  id,
}: {
  kind: "challenge" | "path";
  id: number;
}) {
  const router = useRouter();
  const [pending, setPending] = useState<"publish" | "unpublish" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(action: "publish" | "unpublish") {
    if (pending) return;
    setPending(action);
    setError(null);
    const result =
      kind === "challenge"
        ? await transitionAdminChallenge(id, action)
        : await transitionAdminPath(id, action);
    setPending(null);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        size="sm"
        variant="primary"
        disabled={pending !== null}
        onClick={() => run("publish")}
        title="Approve and publish to learners"
      >
        <Check aria-hidden="true" className="size-4" />
        {pending === "publish" ? "Publishing…" : "Approve"}
      </Button>
      <Button
        type="button"
        size="sm"
        variant="secondary"
        disabled={pending !== null}
        onClick={() => run("unpublish")}
        title="Send back to draft for changes"
      >
        <Undo2 aria-hidden="true" className="size-4" />
        Request changes
      </Button>
      {error ? (
        <p role="alert" className="text-xs text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
