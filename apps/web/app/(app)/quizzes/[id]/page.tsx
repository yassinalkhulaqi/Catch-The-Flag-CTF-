import { notFound } from "next/navigation";
import { ErrorState } from "@/components/empty-state";
import { QuizAttempt } from "@/components/quiz-attempt";
import { ApiError } from "@/lib/api/client";
import { requireUser } from "@/lib/auth";
import { serverApi } from "@/lib/api/server";
import type { Quiz } from "@/lib/types";

export const metadata = { title: "Quiz" };

export default async function QuizPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { id } = await params;

  let quiz: Quiz | null = null;
  try {
    const res = await serverApi<{ data: Quiz }>("GET", `/quizzes/${id}`);
    quiz = res.data;
  } catch (err) {
    if (err instanceof ApiError && (err.status === 404 || err.status === 403)) notFound();
    return <ErrorState title="Quiz unavailable" />;
  }

  if (!quiz) notFound();
  return <QuizAttempt quiz={quiz} />;
}
