import type { Metadata } from "next";
import Link from "next/link";
import { DifficultyPill } from "@/components/difficulty-pill";
import { MarkCompleteButton } from "@/components/mark-complete-button";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { getLesson } from "@/lib/api/lessons";
import { MarkdownContent } from "@/lib/markdown";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const lesson = await getLesson(id);
  return { title: lesson ? `${lesson.title} · Lesson` : "Lesson" };
}

export default async function LessonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const lesson = await getLesson(id);

  if (!lesson) {
    return (
      <div>
        <Card>
          <CardTitle>Lesson not found</CardTitle>
          <CardDescription className="mt-2">
            This lesson doesn&apos;t exist, isn&apos;t published, or the
            backend is unavailable.
          </CardDescription>
          <Link href="/paths" className={buttonVariants("outline", "sm")}>
            Back to paths
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <article className="mx-auto max-w-3xl">
      <p className="font-mono text-xs uppercase tracking-widest text-accent">
        Lesson {lesson.position}
      </p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
        {lesson.title}
      </h1>
      {lesson.summary ? (
        <p className="mt-3 text-muted">{lesson.summary}</p>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {lesson.completed ? (
          <Badge tone="success">Completed</Badge>
        ) : (
          <Badge tone="neutral">Not completed</Badge>
        )}
        <span className="font-mono text-xs text-faint">
          ~{lesson.estimated_minutes} min
        </span>
      </div>

      <div className="mt-6">
        <MarkdownContent content={lesson.content} />
      </div>

      <section aria-labelledby="lesson-challenges" className="mt-10">
        <h2
          id="lesson-challenges"
          className="text-lg font-semibold text-foreground"
        >
          Practice challenges
        </h2>
        {lesson.challenges.length === 0 ? (
          <p className="mt-2 text-sm text-muted">
            No challenges linked to this lesson yet.
          </p>
        ) : (
          <ul className="mt-3 space-y-3">
            {lesson.challenges.map((c) => (
              <li key={c.id}>
                <Card className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      <Link
                        href={`/challenges/${c.slug}`}
                        className="hover:text-accent"
                      >
                        {c.title}
                      </Link>
                    </p>
                    <p className="mt-1 flex flex-wrap items-center gap-2 font-mono text-xs text-faint">
                      {c.points} pts
                      {c.solved ? (
                        <Badge tone="success">Solved</Badge>
                      ) : null}
                    </p>
                  </div>
                  <DifficultyPill difficulty={c.difficulty} />
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="lesson-quiz" className="mt-10">
        <h2 id="lesson-quiz" className="text-lg font-semibold text-foreground">
          Check your knowledge
        </h2>
        {lesson.quiz ? (
          <Card className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-foreground">
                {lesson.quiz.title}
              </p>
              <p className="mt-1">
                {lesson.quiz.passed ? (
                  <Badge tone="success">Passed</Badge>
                ) : (
                  <Badge tone="neutral">Not passed</Badge>
                )}
              </p>
            </div>
            <Link
              href={`/quizzes/${lesson.quiz.id}`}
              className={buttonVariants("primary", "sm")}
            >
              {lesson.quiz.passed ? "Review quiz" : "Take quiz"}
            </Link>
          </Card>
        ) : (
          <p className="mt-2 text-sm text-muted">
            No quiz attached to this lesson.
          </p>
        )}
      </section>

      <div className="mt-10 border-t border-border pt-6">
        <MarkCompleteButton lessonId={lesson.id} completed={lesson.completed} />
      </div>

      <nav
        aria-label="Lesson navigation"
        className="mt-6 flex items-center justify-between gap-3"
      >
        {lesson.prev_lesson_id !== null ? (
          <Link
            href={`/lessons/${lesson.prev_lesson_id}`}
            className={buttonVariants("outline", "sm")}
          >
            ← Previous lesson
          </Link>
        ) : (
          <span />
        )}
        {lesson.next_lesson_id !== null ? (
          <Link
            href={`/lessons/${lesson.next_lesson_id}`}
            className={buttonVariants("outline", "sm")}
          >
            Next lesson →
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </article>
  );
}
