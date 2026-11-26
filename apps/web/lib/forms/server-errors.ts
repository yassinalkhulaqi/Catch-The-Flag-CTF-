import type { FieldPath, FieldValues, UseFormSetError } from "react-hook-form";
import { ApiError } from "@/lib/api/client";
import { errorMessage } from "@/lib/errors";

/**
 * Bridge between the API's uniform 422 envelope and react-hook-form.
 *
 * `error.fields` is authoritative: it maps API field names (which match our
 * form field names) to messages. Business-rule 422s arrive under the generic
 * `form` key and stay at the top level. Client zod is only fast feedback;
 * the server always gets the final word.
 */
export function applyServerError<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
): string {
  if (error instanceof ApiError && error.fields) {
    for (const [field, messages] of Object.entries(error.fields)) {
      if (field === "form" || !messages?.length) continue;
      setError(field as FieldPath<T>, { type: "server", message: messages[0] });
    }
  }

  return errorMessage(error);
}
