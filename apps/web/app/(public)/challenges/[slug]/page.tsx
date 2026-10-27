import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Clock3, Flag, Trophy } from "lucide-react";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Badge } from "@/components/ui/badge";
import { ChallengeCard } from "@/components/challenge-card";
import { ChallengeFiles } from "@/components/challenge-files";
import { DifficultyBadge } from "@/components/difficulty-badge";
import { ErrorState } from "@/components/empty-state";
import { HintList } from "@/components/hint-list";
import { LabActionHub } from "@/components/lab-action-hub";
import { LabObjective } from "@/components/lab-objective";
import { LabSidebar } from "@/components/lab-sidebar";
import { LabStatusBanner } from "@/components/lab-status-banner";
import { Markdown } from "@/components/markdown";
import { SolutionWalkthrough } from "@/components/solution-walkthrough";
import { LabSolveSection } from "@/components/solve-celebration";
import { TierPill } from "@/components/tier-pill";
import { ToolsDrawer } from "@/components/tools/tools-drawer";
import { ApiError } from "@/lib/api/client";
import { getCurrentUser, serverApi } from "@/lib/api/server";
import { formatXp } from "@/lib/utils";
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
      <Breadcrumb
        className="mb-5"
        items={[
          { href: "/challenges", label: "Challenges" },
          { href: `/challenges?category=${challenge.category.slug}`, label: challenge.category.name },
          { label: challenge.title },
        ]}
      />

      <section className="relative overflow-hidden rounded-2xl border border-border bg-surface/60 p-6 sm:p-8">
        <div aria-hidden="true" className="aurora pointer-events-none absolute inset-0 opacity-60" />
        <div className="relative">
          <div className="flex flex-wrap items-center gap-2">
            <DifficultyBadge difficulty={challenge.difficulty} />
            <TierPill tier={challenge.tier} />
            <Badge tone="accent">{formatXp(challenge.points)} pts</Badge>
            {challenge.solved ? (
              <Badge tone="success" dot>
                Solved
              </Badge>
            ) : null}
          </div>
          <h1 className="type-title mt-3 max-w-3xl text-balance">{challenge.title}</h1>
          {challenge.scenario ? (
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
              {challenge.scenario}
            </p>
          ) : null}
          <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 font-mono text-xs text-muted">
            <span className="inline-flex items-center gap-1.5">
              <Flag aria-hidden="true" className="size-3.5 text-accent" />
              {challenge.category.name}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Trophy aria-hidden="true" className="size-3.5 text-accent" />
              {challenge.solve_count} solve{challenge.solve_count === 1 ? "" : "s"}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock3 aria-hidden="true" className="size-3.5 text-accent" />
              ~{challenge.estimated_minutes} min
            </span>
          </div>
        </div>
      </section>

      {/* 1 — status */}
      <div className="mt-4">
        <LabStatusBanner solved={challenge.solved} points={challenge.points} />
      </div>

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
              className="scroll-mt-24 font-mono text-xs uppercase tracking-[0.16em] text-accent"
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
              className="mb-3 scroll-mt-24 font-mono text-xs uppercase tracking-[0.16em] text-accent"
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
              className="mb-3 scroll-mt-24 font-mono text-xs uppercase tracking-[0.16em] text-accent"
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

        <LabSidebar challenge={challenge} authenticated={!!user} />
      </div>

      {(challenge.related?.length ?? 0) > 0 ? (
        <section className="mt-14" aria-labelledby="related-heading">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="type-eyebrow text-accent">Keep going</p>
              <h2 id="related-heading" className="type-heading mt-1">
                Related challenges
              </h2>
            </div>
            <Link
              href={`/challenges?category=${challenge.category.slug}`}
              className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-accent"
            >
              Browse {challenge.category.name}
              <ArrowRight aria-hidden="true" className="size-3.5" />
            </Link>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {(challenge.related ?? []).map((c) => (
              <ChallengeCard key={c.id} challenge={c} variant="tile" />
            ))}
          </div>
        </section>
      ) : null}

      <ToolsDrawer />
    </div>
  );
}
