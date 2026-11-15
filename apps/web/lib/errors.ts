import { ApiError } from "@/lib/api/client";

/** The server-side correlation id for this error, if any. */
export function errorRequestId(error: unknown): string | null {
  if (error instanceof ApiError && error.requestId) return error.requestId;
  return null;
}

/** Extract a user-facing message from an unknown failure. */
export function errorMessage(error: unknown, fallback = "Something went wrong."): string {
  const message =
    error instanceof ApiError
      ? error.message
      : error instanceof Error && error.message
        ? error.message
        : fallback;
  const requestId = errorRequestId(error);
  return requestId ? `${message} (ref: ${requestId})` : message;
}

/** First field error from a validation response, if any. */
export function fieldError(
  error: unknown,
  field: string,
): string | undefined {
  if (error instanceof ApiError && error.fields?.[field]?.[0]) {
    return error.fields[field][0];
  }
  return undefined;
}
