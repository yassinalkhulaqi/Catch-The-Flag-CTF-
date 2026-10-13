import { ApiError } from "@/lib/api/client";

/** Extract a user-facing message from an unknown failure. */
export function errorMessage(error: unknown, fallback = "Something went wrong."): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error && error.message) return error.message;
  return fallback;
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
