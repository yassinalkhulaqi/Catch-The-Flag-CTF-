import Link from "next/link";
import { notFound } from "next/navigation";
import { DifficultyBadge } from "@/components/difficulty-badge";
import { ErrorState, PageHeader } from "@/components/empty-state";
import { CompleteLessonButton } from "@/components/learning-actions";
import { LessonToc, ReadingProgress } from "@/components/lesson-tools";
import { headingId, Markdown } from "@/components/markdown";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ApiError } from "@/lib/api/client";
import { requireUser } from "@/lib/auth";
import { serverApi } from "@/lib/api/server";
import { cn, formatXp } from "@/lib/utils";
import type { Lesson } from "@/lib/types";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  try {
    const res = await serverApi<{ data: Lesson }>("GET", `/lessons/${id}`);
    return { title: res.data.title };
  } catch {
    return { title: "Lesson" };
  }
}

export default async function LessonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { id } = await params;

  let lesson: Lesson | null = null;
  try {
    const res = await serverApi<{ data: Lesson }>("GET", `/lessons/${id}`);
    lesson = res.data;
  } catch (err) {
    if (err instanceof ApiError && (err.status === 404 || err.status === 403)) notFound();
    return <ErrorState title="Lesson unavailable" />;
  }

  if (!lesson) notFound();

  const toc = lesson.content
    .split("\n")
    .flatMap((line) => {
      const match = /^(#{2,3})\s+(.+)$/.exec(line.trim());
      if (!match) return [];
      const text = match[2].replace(/[`*_]/g, "");
      return [{ depth: match[1].length, text, id: headingId(text) }];
    });

  return (
    <div>
      <ReadingProgress />
      <PageHeader
        eyebrow="Lesson"
        title={lesson.title}
        description={lesson.summary ?? undefined}
        actions={<CompleteLessonButton lessonId={lesson.id} completed={lesson.completed} />}
      />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_16rem]">
        <article className="max-w-3xl">
          <Markdown content={lesson.content} />
        </article>
        <LessonToc items={toc} />
      </div>

      {lesson.challenges.length > 0 ? (
        <section className="mt-10" aria-labelledby="linked-challenges">
          <h2
            id="linked-challenges"
            className="mb-3 font-mono text-xs uppercase tracking-[0.16em] text-accent"
          >
            Practice challenges
          </h2>
          <ul className="divide-y divide-border border border-border">
            {lesson.challenges.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <div className="space-y-1">
                  <Link
                    href={`/challenges/${c.slug}`}
                    className="font-semibold hover:text-accent"
                  >
                    {c.title}
                  </Link>
                  <div className="flex items-center gap-2">
                    <DifficultyBadge difficulty={c.difficulty} />
                    {c.solved ? <Badge tone="success">Solved</Badge> : null}
                  </div>
                </div>
                <span className="font-mono text-sm text-accent">{formatXp(c.points)} pts</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {lesson.quiz ? (
        <section className="mt-10" aria-labelledby="quiz-heading">
          <h2
            id="quiz-heading"
            className="mb-3 font-mono text-xs uppercase tracking-[0.16em] text-accent"
          >
            Knowledge check
          </h2>
          <div className="flex flex-wrap items-center justify-between gap-3 border border-border bg-surface p-4">
            <div>
              <p className="font-semibold">{lesson.quiz.title}</p>
              {lesson.quiz.passed ? (
                <p className="text-sm text-success">Passed</p>
              ) : (
                <p className="text-sm text-muted">Not yet passed</p>
              )}
            </div>
            <Link
              href={`/quizzes/${lesson.quiz.id}`}
              className={cn(buttonVariants("outline", "sm"))}
            >
              {lesson.quiz.passed ? "Review quiz" : "Take quiz"}
            </Link>
          </div>
        </section>
      ) : null}

      <nav className="mt-10 flex justify-between border-t border-border pt-4 text-sm" aria-label="Lesson navigation">
        {lesson.prev_lesson_id ? (
          <Link href={`/lessons/${lesson.prev_lesson_id}`} className="text-muted hover:text-foreground">
            Previous
          </Link>
        ) : (
          <span />
        )}
        {lesson.next_lesson_id ? (
          <Link href={`/lessons/${lesson.next_lesson_id}`} className="text-muted hover:text-foreground">
            Next
          </Link>
        ) : (
          <Link href={`/modules/${lesson.module_id}`} className="text-accent hover:underline">
            Back to module
          </Link>
        )}
      </nav>
    </div>
  );
}
