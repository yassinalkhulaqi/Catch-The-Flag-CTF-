"use client";

import { useCallback, useEffect, useState } from "react";
import type { CurrentUser } from "@/lib/types";

type State =
  | { status: "loading" }
  | { status: "ready"; user: CurrentUser | null };

async function fetchUser(): Promise<CurrentUser | null> {
  const res = await fetch("/api/v1/auth/me", {
    credentials: "same-origin",
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  if (res.status === 401 || res.status === 403) return null;
  if (!res.ok) throw new Error("Request failed");
  const payload = (await res.json()) as { data: CurrentUser };
  return payload.data;
}

/**
 * Client-side current-user hook. Reads through the same-origin BFF
 * (`GET /api/v1/auth/me`) — the token never touches JavaScript.
 * Server Components should prefer `getCurrentUser()` instead.
 */
export function useUser() {
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    fetchUser().then(
      (user) => {
        if (!cancelled) setState({ status: "ready", user });
      },
      () => {
        if (!cancelled) setState({ status: "ready", user: null });
      },
    );
    return () => {
      cancelled = true;
    };
  }, []);

  const refresh = useCallback(async () => {
    setState({ status: "loading" });
    try {
      setState({ status: "ready", user: await fetchUser() });
    } catch {
      setState({ status: "ready", user: null });
    }
  }, []);

  return { ...state, refresh };
}
