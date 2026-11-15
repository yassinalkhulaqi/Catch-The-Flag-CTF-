"use client";

import Link from "next/link";
import { useState } from "react";
import { Link as LinkIcon, Unlink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { linkAdminLessonChallenge, unlinkAdminLessonChallenge } from "@/lib/api/admin";
import type { AdminLinkedChallenge } from "@/lib/types";

/** Linked challenges for a lesson (id/title/slug only — never flags). */
export function LinkedChallenges({
  lessonId,
  initialLinks,
}: {
  lessonId: number;
  initialLinks: AdminLinkedChallenge[];
}) {
  const [links, setLinks] = useState(initialLinks);
  const [challengeId, setChallengeId] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function link() {
    const id = Number(challengeId);
    if (!Number.isInteger(id) || id <= 0) {
      setError("Enter the numeric id of the challenge.");
      return;
    }
    setPending(true);
    setError(null);
    const result = await linkAdminLessonChallenge(lessonId, id);
    setPending(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    // Deliberately re-read from the server so the list matches reality.
    try {
      const res = await fetch(`/api/v1/admin/lessons/${lessonId}/challenges`, { credentials: "same-origin" });
      const body = (await res.json()) as { data?: AdminLinkedChallenge[] };
      if (Array.isArray(body.data)) setLinks(body.data);
    } catch {
      // Keep the current list; the link succeeded.
    }
    setChallengeId("");
  }

  async function unlink(link: AdminLinkedChallenge) {
    setPending(true);
    setError(null);
    const result = await unlinkAdminLessonChallenge(lessonId, link.id);
    setPending(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setLinks((current) => current.filter((item) => item.id !== link.id));
  }

  return (
    <div>
      {links.length > 0 ? (
        <ul className="space-y-2">
          {links.map((link) => (
            <li
              key={link.id}
              className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm"
            >
              <span className="min-w-0 flex-1 truncate font-medium text-foreground">
                {link.title}
              </span>
              <Badge tone="neutral" className="normal-case">
                {link.status}
              </Badge>
              <Link
                href={`/challenges/${link.slug}`}
                className="text-xs text-muted hover:text-accent"
              >
                Public page
              </Link>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => unlink(link)}
                disabled={pending}
                aria-label={`Unlink ${link.title}`}
              >
                <Unlink aria-hidden="true" className="size-4" />
                Unlink
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted">No challenges linked yet.</p>
      )}

      <form
        className="mt-4 flex flex-wrap items-end gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          void link();
        }}
      >
        <div>
          <Label htmlFor="link-challenge-id" className="mb-1 block text-xs text-muted">
            Link a challenge by numeric id
          </Label>
          <Input
            id="link-challenge-id"
            type="number"
            min={1}
            inputMode="numeric"
            value={challengeId}
            onChange={(event) => setChallengeId(event.target.value)}
            placeholder="e.g. 42"
            className="w-40"
          />
        </div>
        <Button type="submit" variant="secondary" size="sm" disabled={pending || challengeId.trim() === ""}>
          <LinkIcon aria-hidden="true" className="size-4" />
          Link challenge
        </Button>
      </form>
      {error ? (
        <p role="alert" className="mt-2 text-sm text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
