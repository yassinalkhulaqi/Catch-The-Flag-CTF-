import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { ReviewQueueActions } from "@/components/admin/review-queue-actions";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/empty-state";
import { getReviewQueueServer } from "@/lib/api/admin-server";
import { timeAgo } from "@/lib/utils";

export const metadata = { title: "Admin · Review queue" };

/** Staff queue: everything in status `review` waiting on a decision. */
export default async function AdminReviewQueuePage() {
  const queue = await getReviewQueueServer();

  const total = (queue?.challenges.length ?? 0) + (queue?.paths.length ?? 0);

  return (
    <div>
      <PageHeader
        eyebrow="Moderation"
        title="Review queue"
        description={
          queue === null
            ? "The backend could not be reached — the queue is unavailable right now."
            : total === 0
              ? "Nothing waiting on a review. Nice work."
              : `${total} item(s) waiting on you. Approving publishes; requesting changes returns the item to draft.`
        }
      />

      {queue === null ? (
        <Card className="mt-6">
          <CardTitle>Queue unavailable</CardTitle>
          <CardDescription className="mt-2">
            Try refreshing in a moment, or check that the API container is running (see
            docs/development.md).
          </CardDescription>
        </Card>
      ) : total === 0 ? (
        <Card className="mt-6">
          <CardTitle className="inline-flex items-center gap-2">
            <CheckCircle2 aria-hidden="true" className="size-5 text-success" />
            Queue is empty
          </CardTitle>
          <CardDescription className="mt-2">
            When a challenge or path is sent to review, it lands here for a staff decision.
          </CardDescription>
        </Card>
      ) : (
        <div className="mt-6 space-y-8">
          {queue.challenges.length > 0 ? (
            <section aria-labelledby="review-challenges">
              <h2 id="review-challenges" className="text-sm font-medium text-muted">
                Challenges · {queue.challenges.length}
              </h2>
              <ul className="mt-3 space-y-3">
                {queue.challenges.map((challenge) => (
                  <li
                    key={challenge.id}
                    className="flex flex-wrap items-center gap-4 rounded-xl border border-border bg-surface p-4"
                  >
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/admin/challenges/${challenge.id}/edit`}
                        className="font-semibold hover:text-accent"
                      >
                        {challenge.title}
                      </Link>
                      <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted">
                        <Badge tone="neutral" className="normal-case">
                          {challenge.difficulty}
                        </Badge>
                        <span>{challenge.points} pts</span>
                        {challenge.author ? <span>by {challenge.author}</span> : null}
                        {challenge.updated_at ? <span>updated {timeAgo(challenge.updated_at)}</span> : null}
                      </p>
                    </div>
                    <ReviewQueueActions kind="challenge" id={challenge.id} />
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {queue.paths.length > 0 ? (
            <section aria-labelledby="review-paths">
              <h2 id="review-paths" className="text-sm font-medium text-muted">
                Learning paths · {queue.paths.length}
              </h2>
              <ul className="mt-3 space-y-3">
                {queue.paths.map((path) => (
                  <li
                    key={path.id}
                    className="flex flex-wrap items-center gap-4 rounded-xl border border-border bg-surface p-4"
                  >
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/admin/paths/${path.id}/edit`}
                        className="font-semibold hover:text-accent"
                      >
                        {path.title}
                      </Link>
                      <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted">
                        <Badge tone="neutral" className="normal-case">
                          {path.difficulty}
                        </Badge>
                        {path.estimated_minutes ? <span>{path.estimated_minutes} min</span> : null}
                        {path.updated_at ? <span>updated {timeAgo(path.updated_at)}</span> : null}
                      </p>
                    </div>
                    <ReviewQueueActions kind="path" id={path.id} />
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      )}
    </div>
  );
}
