import type { Metadata } from "next";
import Link from "next/link";
import { ChallengeCard } from "@/components/challenge-card";
import { DifficultyPill } from "@/components/difficulty-pill";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { getChallenge } from "@/lib/api/challenges";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const challenge = await getChallenge(slug);
  return { title: challenge ? `${challenge.title} · Challenges` : "Challenge" };
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(1)} ${units[unit]}`;
}

export default async function ChallengeDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const challenge = await getChallenge(slug);

  if (!challenge) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12">
        <Card>
          <CardTitle>Challenge not found</CardTitle>
          <CardDescription className="mt-2">
            This challenge doesn&apos;t exist, isn&apos;t published, or the
            backend is unavailable.
          </CardDescription>
          <Link href="/challenges" className={buttonVariants("outline", "sm")}>
            Back to challenges
          </Link>
        </Card>
      </div>
    );
  }

  const hints = [...challenge.hints].sort((a, b) => a.position - b.position);

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <p className="font-mono text-xs uppercase tracking-widest text-accent">
        <Link href="/challenges" className="hover:underline">
          Challenges
        </Link>{" "}
        / {challenge.category.slug}
      </p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
        {challenge.title}
      </h1>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Badge tone="neutral">{challenge.category.name}</Badge>
        <DifficultyPill difficulty={challenge.difficulty} />
        {challenge.solved ? <Badge tone="success">Solved</Badge> : null}
        {challenge.tags.map((t) => (
          <span key={t.id} className="font-mono text-xs text-faint">
            #{t.slug}
          </span>
        ))}
      </div>

      <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-1 font-mono text-xs text-muted">
        <div>
          <dt className="sr-only">Points</dt>
          <dd>{challenge.points} pts</dd>
        </div>
        <div>
          <dt className="sr-only">Solves</dt>
          <dd>{challenge.solve_count} solves</dd>
        </div>
        <div>
          <dt className="sr-only">Estimated time</dt>
          <dd>~{challenge.estimated_minutes} min</dd>
        </div>
        {challenge.author ? (
          <div>
            <dt className="sr-only">Author</dt>
            <dd>by {challenge.author.name}</dd>
          </div>
        ) : null}
      </dl>

      {challenge.scenario ? (
        <section aria-labelledby="scenario" className="mt-8">
          <h2 id="scenario" className="text-lg font-semibold text-foreground">
            Scenario
          </h2>
          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted">
            {challenge.scenario}
          </p>
        </section>
      ) : null}

      <section aria-labelledby="description" className="mt-8">
        <h2 id="description" className="text-lg font-semibold text-foreground">
          Description
        </h2>
        <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted">
          {challenge.description}
        </p>
      </section>

      {/* Phase 3: mount FlagSubmitBox here */}
      <div id="flag-submit" />

      <section aria-labelledby="attachments" className="mt-10">
        <h2 id="attachments" className="text-lg font-semibold text-foreground">
          Attachments
        </h2>
        {challenge.files.length === 0 ? (
          <p className="mt-2 text-sm text-muted">
            No files attached — everything you need is in the description.
          </p>
        ) : (
          <ul className="mt-3 space-y-3">
            {challenge.files.map((f) => (
              <li key={f.id}>
                <Card className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {f.original_name}
                    </p>
                    <p className="mt-1 font-mono text-xs text-faint">
                      {formatBytes(f.size_bytes)} · sha256:{f.checksum_sha256}
                    </p>
                  </div>
                  <a
                    href={`/api/v1/challenges/${challenge.id}/files/${f.id}/download`}
                    className={buttonVariants("outline", "sm")}
                  >
                    Download
                  </a>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="hints" className="mt-10">
        <h2 id="hints" className="text-lg font-semibold text-foreground">
          Hints
        </h2>
        {hints.length === 0 ? (
          <p className="mt-2 text-sm text-muted">
            No hints for this challenge. Good hunting.
          </p>
        ) : (
          <ol className="mt-3 space-y-3">
            {hints.map((h) => (
              <li key={h.id}>
                <Card>
                  <p className="font-mono text-xs text-muted">
                    Hint {h.position} · costs {h.cost_points} pts
                  </p>
                  {h.unlocked && h.content ? (
                    <p className="mt-2 text-sm text-foreground">{h.content}</p>
                  ) : (
                    <p className="mt-2 text-sm text-faint">
                      Locked — unlock this hint to reveal its content
                      {h.cost_points > 0
                        ? ` (${h.cost_points} pts will be deducted from the solve value).`
                        : "."}
                    </p>
                  )}
                </Card>
              </li>
            ))}
          </ol>
        )}
      </section>

      {challenge.related.length > 0 ? (
        <section aria-labelledby="related" className="mt-10">
          <h2 id="related" className="text-lg font-semibold text-foreground">
            Related challenges
          </h2>
          <ul className="mt-3 grid gap-4 sm:grid-cols-2">
            {challenge.related.map((c) => (
              <li key={c.id}>
                <ChallengeCard challenge={c} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
