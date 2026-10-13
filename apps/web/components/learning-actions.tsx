"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api/client";
import { errorMessage } from "@/lib/errors";

export function StartPathButton({ pathId }: { pathId: number }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div>
      <Button
        disabled={pending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            try {
              await api.post(`/paths/${pathId}/start`);
              router.refresh();
            } catch (err) {
              setError(errorMessage(err));
            }
          });
        }}
      >
        {pending ? "Starting…" : "Start path"}
      </Button>
      {error ? (
        <p role="alert" className="mt-2 text-sm text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function CompleteLessonButton({
  lessonId,
  completed,
}: {
  lessonId: number;
  completed: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (completed) {
    return (
      <p className="font-mono text-xs uppercase tracking-wide text-success" role="status">
        Lesson completed
      </p>
    );
  }

  return (
    <div>
      <Button
        disabled={pending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            try {
              await api.post(`/lessons/${lessonId}/complete`);
              router.refresh();
            } catch (err) {
              setError(errorMessage(err));
            }
          });
        }}
      >
        {pending ? "Saving…" : "Mark complete"}
      </Button>
      {error ? (
        <p role="alert" className="mt-2 text-sm text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
