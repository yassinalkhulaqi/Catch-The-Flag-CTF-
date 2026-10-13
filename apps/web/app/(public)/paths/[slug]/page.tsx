import type { Metadata } from "next";
import Link from "next/link";
import { StartPathButton } from "@/components/start-path-button";
import { DifficultyPill } from "@/components/difficulty-pill";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { getModuleDetail, getPath } from "@/lib/api/paths";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const path = await getPath(slug);
  return { title: path ? `${path.title} · Paths` : "Learning path" };
}

export default async function PathDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const path = await getPath(slug);

  if (!path) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12">
        <Card>
          <CardTitle>Path not found</CardTitle>
          <CardDescription className="mt-2">
            This path doesn&apos;t exist, isn&apos;t published, or the backend
            is unavailable.
          </CardDescription>
          <Link href="/paths" className={buttonVariants("outline", "sm")}>
            Back to paths
          </Link>
        </Card>
      </div>
    );
  }

  const modules = [...path.modules].sort((a, b) => a.position - b.position);
  // Auth-gated lesson detail; null entries degrade to module counts.
  const moduleDetails = await Promise.all(
    modules.map((m) => getModuleDetail(m.id)),
  );
  const started = path.progress_percent > 0 || path.completed;

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <p className="font-mono text-xs uppercase tracking-widest text-accent">
        <Link href="/paths" className="hover:underline">
          Paths
        </Link>
        {path.category ? ` / ${path.category.slug}` : null}
      </p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
        {path.title}
      </h1>
      <p className="mt-3 max-w-2xl text-muted">{path.summary}</p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {path.category ? (
          <Badge tone="neutral">{path.category.name}</Badge>
        ) : null}
        <DifficultyPill difficulty={path.difficulty} />
        {path.completed ? <Badge tone="success">Completed</Badge> : null}
      </div>

      <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-1 font-mono text-xs text-muted">
        <div>
          <dt className="sr-only">Modules</dt>
          <dd>{path.module_count} modules</dd>
        </div>
        <div>
          <dt className="sr-only">Lessons</dt>
          <dd>{path.lesson_count} lessons</dd>
        </div>
        <div>
          <dt className="sr-only">Challenges</dt>
          <dd>{path.challenge_count} challenges</dd>
        </div>
        <div>
          <dt className="sr-only">Estimated time</dt>
          <dd>~{path.estimated_minutes} min</dd>
        </div>
      </dl>

      {path.description ? (
        <p className="mt-6 whitespace-pre-line text-sm leading-relaxed text-muted">
          {path.description}
        </p>
      ) : null}

      {path.progress_percent > 0 ? (
        <div className="mt-6" aria-label="Path progress">
          <div className="flex items-center justify-between text-xs text-muted">
            <span>Your progress</span>
            <span className="font-mono">{path.progress_percent}%</span>
          </div>
          <div
            role="progressbar"
            aria-valuenow={path.progress_percent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Path completion"
            className="mt-2 h-2 overflow-hidden rounded-full bg-surface-raised"
          >
            <div
              className="h-full rounded-full bg-accent"
              style={{ width: `${path.progress_percent}%` }}
            />
          </div>
        </div>
      ) : null}

      <div className="mt-6">
        <StartPathButton pathId={path.id} started={started} />
      </div>

      {path.prerequisites.length > 0 ? (
        <section aria-labelledby="prerequisites" className="mt-10">
          <h2 id="prerequisites" className="text-lg font-semibold text-foreground">
            Prerequisites
          </h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {path.prerequisites.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/paths/${p.slug}`}
                  className={buttonVariants("outline", "sm")}
                >
                  {p.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section aria-labelledby="modules" className="mt-10">
        <h2 id="modules" className="text-lg font-semibold text-foreground">
          Modules
        </h2>
        {modules.length === 0 ? (
          <p className="mt-2 text-sm text-muted">
            Modules are being authored for this path.
          </p>
        ) : (
          <ol className="mt-3 space-y-4">
            {modules.map((m, i) => {
              const detail = moduleDetails[i];
              const lessons = [...(detail?.lessons ?? [])].sort(
                (a, b) => a.position - b.position,
              );
              return (
                <li key={m.id}>
                  <Card>
                    <p className="font-mono text-xs text-faint">
                      Module {m.position}
                    </p>
                    <h3 className="mt-1 text-sm font-semibold text-foreground">
                      {m.title}
                    </h3>
                    {m.description ? (
                      <p className="mt-1 text-sm text-muted">{m.description}</p>
                    ) : null}
                    <p className="mt-2 font-mono text-xs text-faint">
                      {m.lesson_count} lessons · {m.challenge_count} challenges
                      {m.completed_lesson_count > 0
                        ? ` · ${m.completed_lesson_count} completed`
                        : null}
                    </p>
                    {lessons.length > 0 ? (
                      <ol className="mt-3 space-y-2 border-t border-border pt-3">
                        {lessons.map((lesson) => (
                          <li
                            key={lesson.id}
                            className="flex flex-wrap items-center gap-2 text-sm"
                          >
                            <span
                              aria-hidden="true"
                              className={
                                lesson.completed ? "text-success" : "text-faint"
                              }
                            >
                              {lesson.completed ? "✓" : "○"}
                            </span>
                            <span className="text-foreground">
                              {lesson.title}
                            </span>
                            <span className="font-mono text-xs text-faint">
                              ~{lesson.estimated_minutes} min
                            </span>
                            {lesson.solved ? (
                              <Badge tone="success">Solved</Badge>
                            ) : null}
                          </li>
                        ))}
                      </ol>
                    ) : null}
                  </Card>
                </li>
              );
            })}
          </ol>
        )}
      </section>
    </div>
  );
}
