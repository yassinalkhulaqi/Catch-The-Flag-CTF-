"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { completeLesson } from "@/lib/api/lesson-client";

/**
 * Lesson completion island on the lesson reader page.
 * POSTs through the same-origin BFF and refreshes server state.
 * Failures degrade to an inline note — never a throw.
 */
export function MarkCompleteButton({
  lessonId,
  completed,
}: {
  lessonId: number;
  completed: boolean;
}) {
  const router = useRouter();
  const [done, setDone] = useState(completed);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function markComplete() {
    setPending(true);
    setError(null);
    const res = await completeLesson(lessonId);
    setPending(false);
    if (res) {
      setDone(true);
      router.refresh();
    } else {
      setError(
        "Could not mark this lesson complete. The backend may be unavailable — try again later.",
      );
    }
  }

  if (done) {
    return (
      <p className="text-sm text-success" role="status">
        Lesson completed — nice work.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <Button onClick={markComplete} disabled={pending}>
        {pending ? "Saving…" : "Mark as complete"}
      </Button>
      {error ? (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
