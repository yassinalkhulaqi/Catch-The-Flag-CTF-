"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CopyPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  duplicateAdminChallenge,
  duplicateAdminPath,
} from "@/lib/api/admin";

/**
 * Duplicate a challenge or path as a new draft and jump to its editor.
 * Challenge files and flags are deliberately not copied.
 */
export function DuplicateButton({
  kind,
  id,
}: {
  kind: "challenge" | "path";
  id: number;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function duplicate() {
    if (pending) return;
    setPending(true);
    setError(null);

    const result =
      kind === "challenge"
        ? await duplicateAdminChallenge(id)
        : await duplicateAdminPath(id);

    setPending(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }

    router.push(
      kind === "challenge"
        ? `/admin/challenges/${result.data.id}/edit`
        : `/admin/paths/${result.data.id}/edit`,
    );
    router.refresh();
  }

  return (
    <span className="inline-flex flex-col gap-1">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={pending}
        onClick={duplicate}
        title="Create a draft copy with content, hints, tags and (for paths) modules, lessons and quizzes"
      >
        <CopyPlus aria-hidden="true" className="size-4" />
        {pending ? "Copying…" : "Duplicate"}
      </Button>
      {error ? (
        <span role="alert" className="text-xs text-danger">
          {error}
        </span>
      ) : null}
    </span>
  );
}
