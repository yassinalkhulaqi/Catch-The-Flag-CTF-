import Link from "next/link";
import { notFound } from "next/navigation";
import { ChallengeCard } from "@/components/challenge-card";
import { ChallengeFiles } from "@/components/challenge-files";
import { DifficultyBadge } from "@/components/difficulty-badge";
import { ErrorState, PageHeader } from "@/components/empty-state";
import { FlagSubmitBox } from "@/components/flag-submit-box";
import { HintList } from "@/components/hint-list";
import { Markdown } from "@/components/markdown";
import { Badge } from "@/components/ui/badge";
import { ApiError } from "@/lib/api/client";
import { getCurrentUser, serverApi } from "@/lib/api/server";
import { formatXp } from "@/lib/utils";
import type { ChallengeDetail } from "@/lib/types";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  try {
    const res = await serverApi<{ data: ChallengeDetail }>("GET", `/challenges/${slug}`);
    return { title: res.data.title };
  } catch {
    return { title: "Challenge" };
  }
}

export default async function ChallengeDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const user = await getCurrentUser();

  let challenge: ChallengeDetail | null = null;
  try {
    const res = await serverApi<{ data: ChallengeDetail }>("GET", `/challenges/${slug}`);
    challenge = res.data;
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    return (
      <div className="mx-auto max-w-6xl px-4 py-10">
        <ErrorState title="Challenge unavailable" />
      </div>
    );
  }

  if (!challenge) notFound();

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <PageHeader
        eyebrow={challenge.category.name}
        title={challenge.title}
        transitionName={`c-${challenge.slug}`}
        description={challenge.scenario ?? undefined}
        actions={
          <div className="flex flex-col items-end gap-2">
            <DifficultyBadge difficulty={challenge.difficulty} />
            <p className="font-mono text-sm text-accent">{formatXp(challenge.points)} pts</p>
            {challenge.solved ? <Badge tone="success">Solved</Badge> : null}
          </div>
        }
      />

      <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
        <div className="space-y-10">
          <section aria-labelledby="desc-heading">
            <h2 id="desc-heading" className="font-mono text-xs uppercase tracking-[0.16em] text-accent">
              Description
            </h2>
            <div className="mt-3">
              <Markdown content={challenge.description} />
            </div>
          </section>

          <section aria-labelledby="files-heading">
            <h2 id="files-heading" className="mb-3 font-mono text-xs uppercase tracking-[0.16em] text-accent">
              Files
            </h2>
            <ChallengeFiles
              challengeId={challenge.id}
              files={challenge.files}
              authenticated={!!user}
            />
          </section>

          <section aria-labelledby="hints-heading">
            <h2 id="hints-heading" className="mb-3 font-mono text-xs uppercase tracking-[0.16em] text-accent">
              Hints
            </h2>
            {user ? (
              <HintList challengeId={challenge.id} hints={challenge.hints} />
            ) : (
              <p className="text-sm text-muted">
                <Link href="/login" className="text-accent hover:underline">
                  Log in
                </Link>{" "}
                to unlock hints.
              </p>
            )}
          </section>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          {user ? (
            <FlagSubmitBox challengeId={challenge.id} alreadySolved={challenge.solved} />
          ) : (
            <div className="border border-border bg-surface p-5">
              <p className="font-mono text-xs uppercase tracking-[0.16em] text-accent">
                Submit flag
              </p>
              <p className="mt-3 text-sm text-muted">
                <Link href="/login" className="text-accent hover:underline">
                  Sign in
                </Link>{" "}
                to submit flags and earn XP.
              </p>
            </div>
          )}
          <div className="border border-border bg-surface p-4 text-sm text-muted">
            <p>
              Points remaining:{" "}
              <span className="font-mono text-foreground">{challenge.points_remaining}</span>
            </p>
            <p className="mt-1">
              Solves:{" "}
              <span className="font-mono text-foreground">{challenge.solve_count}</span>
            </p>
            {challenge.tags.length > 0 ? (
              <p className="mt-3 font-mono text-xs text-faint">
                {challenge.tags.map((t) => t.name).join(" · ")}
              </p>
            ) : null}
          </div>
        </aside>
      </div>

      {(challenge.related?.length ?? 0) > 0 ? (
        <section className="mt-14" aria-labelledby="related-heading">
          <h2
            id="related-heading"
            className="font-mono text-xs uppercase tracking-[0.16em] text-accent"
          >
            Related challenges
          </h2>
          <div className="mt-3 border-t border-border">
            {(challenge.related ?? []).map((c) => (
              <ChallengeCard key={c.id} challenge={c} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
