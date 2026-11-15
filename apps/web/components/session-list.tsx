"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Laptop, Trash2, X } from "lucide-react";
import { api } from "@/lib/api/client";
import { errorMessage } from "@/lib/errors";
import { timeAgo } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import type { ActiveSession } from "@/lib/types";

/**
 * Session list island: shows the caller's sanctum sessions (name, created,
 * last used, expiry) and revokes any of them two-step.
 */
export function SessionList({ initialSessions }: { initialSessions: ActiveSession[] }) {
  const router = useRouter();
  const toast = useToast();
  const [sessions, setSessions] = useState(initialSessions);
  const [confirmingId, setConfirmingId] = useState<number | null>(null);
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function revoke(session: ActiveSession) {
    setPendingId(session.id);
    setError(null);
    try {
      await api.delete(`/auth/sessions/${session.id}`);
      setSessions((current) => current.filter((item) => item.id !== session.id));
      setConfirmingId(null);
      toast.push({
        title: session.current ? "This device was signed out." : "Session revoked.",
        tone: "success",
      });
      if (session.current) {
        router.push("/login");
        router.refresh();
      }
    } catch (err) {
      setError(errorMessage(err, "Could not revoke the session."));
    } finally {
      setPendingId(null);
    }
  }

  if (sessions.length === 0) {
    return (
      <p className="text-sm text-muted">No other sessions.</p>
    );
  }

  return (
    <div>
      <ul className="divide-y divide-border">
        {sessions.map((session) => (
          <li key={session.id} className="flex flex-wrap items-center gap-3 py-3 first:pt-1 last:pb-0">
            <span
              aria-hidden="true"
              className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-surface-raised text-muted"
            >
              <Laptop className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-foreground">
                <span className="max-w-64 truncate">{session.name}</span>
                {session.current ? (
                  <Badge tone="accent" className="normal-case">
                    This device
                  </Badge>
                ) : null}
              </p>
              <p className="mt-0.5 text-xs text-muted">
                Last used {session.last_used_at ? timeAgo(session.last_used_at) : "never"}
                {session.created_at ? ` · created ${new Date(session.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}` : ""}
                {session.expires_at ? ` · expires ${new Date(session.expires_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}` : ""}
              </p>
            </div>
            {confirmingId === session.id ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted">Revoke?</span>
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  onClick={() => revoke(session)}
                  disabled={pendingId !== null}
                  aria-label="Confirm revoking this session"
                >
                  <Check aria-hidden="true" className="size-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setConfirmingId(null)}
                  disabled={pendingId !== null}
                  aria-label="Keep this session"
                >
                  <X aria-hidden="true" className="size-4" />
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setConfirmingId(session.id)}
                disabled={pendingId !== null}
              >
                <Trash2 aria-hidden="true" className="size-4" />
                Revoke
              </Button>
            )}
          </li>
        ))}
      </ul>
      {error ? (
        <p role="alert" className="mt-3 text-sm text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
