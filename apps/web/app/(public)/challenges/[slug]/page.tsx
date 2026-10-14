import Link from "next/link";
import { notFound } from "next/navigation";
import { ChallengeCard } from "@/components/challenge-card";
import { ChallengeFiles } from "@/components/challenge-files";
import { ErrorState, PageHeader } from "@/components/empty-state";
import { HintList } from "@/components/hint-list";
import { LabActionHub } from "@/components/lab-action-hub";
import { LabObjective } from "@/components/lab-objective";
import { LabStatusBanner } from "@/components/lab-status-banner";
import { Markdown } from "@/components/markdown";
import { SolutionWalkthrough } from "@/components/solution-walkthrough";
import { LabSolveSection } from "@/components/solve-celebration";
import { ToolsDrawer } from "@/components/tools/tools-drawer";
import { ApiError } from "@/lib/api/client";
import { getCurrentUser, serverApi } from "@/lib/api/server";
import type { ChallengeDetail } from "@/lib/types";

type ChallengeDetailWithWalkthrough = ChallengeDetail & {
  solution_walkthrough?: string | null;
};

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

  let challenge: ChallengeDetailWithWalkthrough | null = null;
  try {
    const res = await serverApi<{ data: ChallengeDetailWithWalkthrough }>(
      "GET",
      `/challenges/${slug}`,
    );
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

  const objectiveText =
    challenge.scenario ?? "Analyze the artifacts below and recover the flag.";
  const targetText =
    challenge.files.length > 0
      ? challenge.files.map((f) => f.original_name).join(", ")
      : `${challenge.category.name} static lab`;
  const walkthrough = challenge.solution_walkthrough;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <PageHeader
        eyebrow={challenge.category.name}
        title={challenge.title}
        description={challenge.scenario ?? undefined}
      />

      {/* 1 — status */}
      <LabStatusBanner solved={challenge.solved} points={challenge.points} />

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="space-y-8">
          {/* 2 — objective */}
          <LabObjective
            objective={challenge.scenario}
            target={targetText}
            difficulty={challenge.difficulty}
            points={challenge.points}
            categoryName={challenge.category.name}
          />

          <section aria-labelledby="briefing-heading">
            <h2
              id="briefing-heading"
              className="font-mono text-xs uppercase tracking-[0.16em] text-accent"
            >
              Briefing
            </h2>
            <div className="mt-3">
              <Markdown content={challenge.description} />
            </div>
          </section>

          {/* 3 — access the lab (static artifacts, no live infra) */}
          <LabActionHub
            challengeId={challenge.id}
            files={challenge.files}
            targetText={targetText}
            objectiveText={objectiveText}
            authenticated={!!user}
          />

          {/* 4 — flag submit + celebration */}
          <section aria-labelledby="submit-heading">
            <h2
              id="submit-heading"
              className="mb-3 font-mono text-xs uppercase tracking-[0.16em] text-accent"
            >
              Submit
            </h2>
            {user ? (
              <LabSolveSection
                challengeId={challenge.id}
                alreadySolved={challenge.solved}
                pointsRemaining={challenge.points_remaining}
              />
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
          </section>

          {/* 5 — hints */}
          <section aria-labelledby="hints-heading">
            <h2
              id="hints-heading"
              className="mb-3 font-mono text-xs uppercase tracking-[0.16em] text-accent"
            >
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

          {/* 6 — attachments */}
          <section aria-labelledby="files-heading">
            <h2
              id="files-heading"
              className="mb-3 font-mono text-xs uppercase tracking-[0.16em] text-accent"
            >
              Attachments
            </h2>
            <ChallengeFiles
              challengeId={challenge.id}
              files={challenge.files}
              authenticated={!!user}
            />
          </section>

          {/* 7 — official walkthrough (nullable until STEP 6 backend field lands) */}
          {typeof walkthrough === "string" && walkthrough.trim() !== "" ? (
            <section aria-labelledby="walkthrough-heading">
              <h2 id="walkthrough-heading" className="sr-only">
                Official solution walkthrough
              </h2>
              <SolutionWalkthrough walkthrough={walkthrough} />
            </section>
          ) : null}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start" aria-label="Lab details">
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

      <ToolsDrawer />
    </div>
  );
}
