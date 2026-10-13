import { api } from "@/lib/api/client";
import type {
  QuizAttemptResult,
  QuizQuestion,
} from "@/lib/types";

export interface QuizAttemptDetail {
  attempt: QuizAttemptResult;
  questions: QuizQuestion[];
}

/**
 * Browser-side quiz attempt helpers for the QuizRunner island. All POST
 * through the same-origin BFF and return null on ApiError (never throw).
 *
 * Lives in its own module (instead of lib/api/quiz.ts) because that file
 * imports next/headers via serverApi, which cannot ship to the browser.
 */

/** Start an attempt. */
export async function startQuizAttempt(
  quizId: string | number,
): Promise<{ id: number } | null> {
  try {
    const res = await api.post<{ data: { attempt: { id: number } } }>(
      `/quizzes/${encodeURIComponent(String(quizId))}/attempts`,
    );
    return res.data?.attempt ?? null;
  } catch {
    return null;
  }
}

/** Save one answer. */
export async function saveAttemptAnswer(
  attemptId: number,
  input: { question_id: number; selected_option_ids: number[] },
): Promise<{ saved: boolean } | null> {
  try {
    const res = await api.post<{ data: { saved: boolean } }>(
      `/quiz-attempts/${attemptId}/answer`,
      input,
    );
    return res.data ?? null;
  } catch {
    return null;
  }
}

/** Submit an attempt for server-side scoring. */
export async function submitQuizAttempt(
  attemptId: number,
): Promise<QuizAttemptResult | null> {
  try {
    const res = await api.post<{ data: QuizAttemptResult }>(
      `/quiz-attempts/${attemptId}/submit`,
      undefined,
    );
    return res.data ?? null;
  } catch {
    return null;
  }
}

/**
 * Own attempt result incl. explanations. The response shape is normalized
 * defensively ({attempt, questions} or a flattened attempt object).
 */
export async function getQuizAttempt(
  attemptId: number,
): Promise<QuizAttemptDetail | null> {
  try {
    const res = await api.get<{ data: unknown }>(`/quiz-attempts/${attemptId}`);
    const data = (res.data ?? {}) as Record<string, unknown>;
    const rawAttempt = (data.attempt ?? data) as Record<string, unknown>;
    const questions = (Array.isArray(data.questions)
      ? data.questions
      : Array.isArray(rawAttempt.questions)
        ? rawAttempt.questions
        : []) as QuizQuestion[];
    if (typeof rawAttempt.id !== "number") return null;
    return {
      attempt: {
        id: rawAttempt.id,
        score: typeof rawAttempt.score === "number" ? rawAttempt.score : 0,
        passed: rawAttempt.passed === true,
        correct_count:
          typeof rawAttempt.correct_count === "number"
            ? rawAttempt.correct_count
            : 0,
        total:
          typeof rawAttempt.total === "number"
            ? rawAttempt.total
            : questions.length,
      },
      questions,
    };
  } catch {
    return null;
  }
}
