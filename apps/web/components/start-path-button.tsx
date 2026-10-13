"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ApiError, api } from "@/lib/api/client";

/**
 * "Start path" island on the public path detail page.
 * POSTs through the same-origin BFF; the backend owns idempotency and
 * progress state. All failures degrade to an inline note — never a throw.
 */
export function StartPathButton({
  pathId,
  started,
}: {
  pathId: number;
  started: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(started);
  const [error, setError] = useState<string | null>(null);

  async function start() {
    setPending(true);
    setError(null);
    try {
      await api.post(`/paths/${pathId}/start`);
      setDone(true);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Could not start this path. The backend may be unavailable — try again later.",
      );
    } finally {
      setPending(false);
    }
  }

  if (done) {
    return (
      <p className="text-sm text-success" role="status">
        You&apos;re on this path — pick up where you left off.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <Button onClick={start} disabled={pending}>
        {pending ? "Starting…" : "Start path"}
      </Button>
      {error ? (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}
      <p className="text-xs text-faint">
        Requires an account. If the backend is unavailable, starting is
        disabled until it recovers.
      </p>
    </div>
  );
}
