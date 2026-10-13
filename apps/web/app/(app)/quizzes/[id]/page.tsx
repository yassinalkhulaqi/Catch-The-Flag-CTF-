import type { Metadata } from "next";
import Link from "next/link";
import { QuizRunner } from "@/components/quiz-runner";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { getQuiz } from "@/lib/api/quiz";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const quiz = await getQuiz(id);
  return { title: quiz ? `${quiz.title} · Quiz` : "Quiz" };
}

export default async function QuizPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const quiz = await getQuiz(id);

  if (!quiz) {
    return (
      <div>
        <Card>
          <CardTitle>Quiz not found</CardTitle>
          <CardDescription className="mt-2">
            This quiz doesn&apos;t exist, isn&apos;t published, or the backend
            is unavailable.
          </CardDescription>
          <Link href="/paths" className={buttonVariants("outline", "sm")}>
            Back to paths
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <p className="font-mono text-xs uppercase tracking-widest text-accent">
        Quiz
      </p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
        {quiz.title}
      </h1>
      {quiz.description ? (
        <p className="mt-3 text-muted">{quiz.description}</p>
      ) : null}
      <p className="mt-4 font-mono text-xs text-muted">
        {quiz.questions.length}{" "}
        {quiz.questions.length === 1 ? "question" : "questions"} · pass score{" "}
        {quiz.pass_score}
      </p>
      <div className="mt-6">
        <QuizRunner quiz={quiz} />
      </div>
    </div>
  );
}
