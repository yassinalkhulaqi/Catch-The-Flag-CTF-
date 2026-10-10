import type { ApiErrorBody } from "@/lib/types";

/**
 * Browser-side API client. Talks ONLY to the same-origin Next.js BFF
 * (`/api/v1/*`); the BFF attaches the session token server-side.
 * The browser never sees or stores credentials.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly fields?: Record<string, string[]>;
  readonly requestId?: string;
  readonly retryAfterSeconds: number | null;

  constructor(
    status: number,
    body: ApiErrorBody["error"] | null,
    retryAfterSeconds: number | null = null,
  ) {
    super(body?.message ?? "Request failed");
    this.name = "ApiError";
    this.status = status;
    this.code = body?.code ?? "server_error";
    this.fields = body?.fields;
    this.requestId = body?.request_id;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
}

async function request<T>(
  method: string,
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { body, headers, ...rest } = options;
  const isForm = body instanceof FormData;

  const res = await fetch(`/api/v1${path}`, {
    method,
    credentials: "same-origin",
    headers: {
      Accept: "application/json",
      ...(body !== undefined && !isForm && typeof body !== "string"
        ? { "Content-Type": "application/json" }
        : {}),
      ...headers,
    },
    body:
      body === undefined
        ? undefined
        : isForm || typeof body === "string"
          ? body
          : JSON.stringify(body),
    ...rest,
  });

  if (res.status === 204) return undefined as T;

  let payload: unknown = null;
  try {
    payload = await res.json();
  } catch {
    /* non-JSON error body */
  }

  if (!res.ok) {
    const err = payload as ApiErrorBody | null;
    throw new ApiError(res.status, err?.error ?? null, retryAfterSeconds(res));
  }
  return payload as T;
}

function retryAfterSeconds(res: Response): number | null {
  const header = res.headers.get("Retry-After");
  if (!header) return null;
  const seconds = Number(header);
  if (Number.isFinite(seconds) && seconds >= 0) return seconds;
  const date = Date.parse(header);
  if (Number.isNaN(date)) return null;
  return Math.max(0, Math.ceil((date - Date.now()) / 1000));
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) => request<T>("GET", path, options),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>("POST", path, { ...options, body }),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>("PUT", path, { ...options, body }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>("PATCH", path, { ...options, body }),
  delete: <T>(path: string, options?: RequestOptions) =>
    request<T>("DELETE", path, options),
};
