import { z } from "zod";

/** Answers are keyed by question id; every question must have a selection. */
export function quizAnswersSchema(questionIds: number[]) {
  return z.object({
    answers: z.record(z.string(), z.array(z.number().int())).refine(
      (answers) => questionIds.every((id) => (answers[String(id)]?.length ?? 0) > 0),
      "Answer every question before submitting.",
    ),
  });
}

export type QuizAnswersInput = { answers: Record<string, number[]> };
