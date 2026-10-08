import { cache } from "react";
import { cookies } from "next/headers";
import { ApiError } from "@/lib/api/client";
import type { AuthResponse, CurrentUser } from "@/lib/types";

/**
 * Server-side API client (Server Components / route handlers).
 * Calls Laravel directly with the token from the httpOnly session cookie.
 * Authorization is STILL enforced again by Laravel — this is transport only.
 */
const API_URL = process.env.API_URL ?? "http://localhost:8000";
export const SESSION_COOKIE = process.env.SESSION_COOKIE_NAME ?? "ctf_session";

export async function sessionToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(SESSION_COOKIE)?.value ?? null;
}

interface ServerRequestOptions extends Omit<RequestInit, "body" | "headers"> {
  body?: unknown;
  token?: string | null;
  headers?: Record<string, string>;
}

export async function serverApi<T>(
  method: string,
  path: string,
  options: ServerRequestOptions = {},
): Promise<T> {
  const { body, headers, token, ...rest } = options;
  const authToken = token !== undefined ? token : await sessionToken();

  const res = await fetch(`${API_URL}/api/v1${path}`, {
    method,
    cache: "no-store",
    headers: {
      Accept: "application/json",
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...(body !== undefined && !(body instanceof FormData)
        ? { "Content-Type": "application/json" }
        : {}),
      ...headers,
    },
    body:
      body === undefined
        ? undefined
        : body instanceof FormData
          ? body
          : typeof body === "string"
            ? body
            : JSON.stringify(body),
    ...rest,
  });

  if (res.status === 204) return undefined as T;

  let payload: unknown = null;
  try {
    payload = await res.json();
  } catch {
    /* non-JSON */
  }

  if (!res.ok) {
    const err = payload as { error?: ConstructorParameters<typeof ApiError>[1] };
    throw new ApiError(res.status, err?.error ?? null);
  }
  return payload as T;
}

/** Current authenticated user or null (never throws for 401). Deduped per request. */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const token = await sessionToken();
  if (!token) return null;
  try {
    const res = await serverApi<{ data: CurrentUser }>("GET", "/auth/me", { token });
    return res.data;
  } catch {
    return null;
  }
});

/** Convenience for auth POSTs (login/register) — returns raw auth payload. */
export async function serverAuth(
  path: string,
  body: unknown,
): Promise<AuthResponse> {
  const res = await serverApi<{ data: AuthResponse }>("POST", path, {
    body,
    token: null,
  });
  return res.data;
}
