import { ApiError, api } from "@/lib/api/client";
import type {
  AdminLesson,
  AdminModule,
  AdminQuiz,
  AdminQuizOption,
  AdminQuizQuestion,
  AdminQuizQuestionType,
  AdminLinkedChallenge,
  Category,
  ContentStatus,
  Difficulty,
  Paginated,
  Role,
} from "@/lib/types";

/**
 * Browser-side admin API client — for `"use client"` islands ONLY.
 *
 * Talks exclusively to the same-origin Next.js BFF (`/api/v1/*`); the BFF
 * attaches the session token server-side, so the browser never sees secrets.
 * Imports ONLY `@/lib/api/client` (plus types) — never `@/lib/api/server`
 * or any module that pulls in `next/headers`, which cannot ship to the
 * browser (same split as `lesson-client.ts` / `quiz-client.ts`).
 *
 * Conventions (per contract):
 * - Query helpers return `[]` / `null` on ApiError — they never throw, so
 *   islands render inline empty states instead of crashing.
 * - Mutation helpers return `AdminResult<T>` (`{ok:true,data}` or
 *   `{ok:false,message,fields}`) — never throw — so forms can surface
 *   server-side validation errors (`fields`) inside `role="alert"` regions.
 *
 * Endpoint contract (backend-owned): see `docs/api.md` §5.
 */

export type AdminChallengeTransition =
  | "publish"
  | "unpublish"
  | "archive"
  | "review";

export type AdminPathTransition = AdminChallengeTransition;

export interface AdminChallengeRow {
  id: number;
  title: string;
  slug: string;
  status: ContentStatus;
  points: number;
  difficulty: Difficulty;
}

export interface AdminChallengeDetail extends AdminChallengeRow {
  description: string;
  scenario: string | null;
  category_id: number | null;
  category?: Pick<Category, "id" | "name" | "slug"> | null;
}

export interface AdminChallengeInput {
  title: string;
  slug: string;
  description: string;
  scenario?: string | null;
  category_id: number;
  difficulty: Difficulty;
  points: number;
}

export interface AdminFileMeta {
  id: number;
  original_name: string;
  mime_type: string | null;
  size_bytes: number;
}

export interface AdminHint {
  id: number;
  position: number;
  cost_points: number;
  /** Only present when the backend includes it (admin read). */
  content?: string;
}

export interface AdminHintInput {
  content: string;
  cost_points: number;
  position: number;
}

export interface AdminFlagRef {
  id: number;
  label: string;
  is_active: boolean;
  case_sensitive?: boolean;
}

/**
 * Write-only flag input. Flag VALUES are never readable: list endpoints
 * return labels/state only, and there is intentionally no reveal endpoint.
 */
export interface AdminFlagInput {
  label: string;
  flag: string;
  case_sensitive: boolean;
}

export interface AdminUserRow {
  id: number;
  name: string;
  email: string;
  role: Role;
  xp: number;
  banned_at: string | null;
}

export interface AdminAuditEntry {
  id: number | string;
  actor: unknown;
  action: string;
  auditable: unknown;
  changes: unknown;
  created_at: string;
}

export interface AdminPathRow {
  id: number;
  title: string;
  slug: string;
  status: ContentStatus;
}

export interface AdminPathInput {
  title: string;
  slug: string;
  summary?: string;
  description?: string;
}

export interface AdminOk<T> {
  ok: true;
  data: T;
}

export interface AdminErr {
  ok: false;
  message: string;
  fields?: Record<string, string[]>;
}

export type AdminResult<T> = AdminOk<T> | AdminErr;

export const ADMIN_DIFFICULTIES: Difficulty[] = [
  "beginner",
  "intermediate",
  "advanced",
  "expert",
];

export const ADMIN_STATUSES: ContentStatus[] = [
  "draft",
  "review",
  "published",
  "archived",
];

/* ---------- internals ---------- */

function buildQuery(
  params: Record<string, string | number | undefined>,
): string {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === "") continue;
    qs.set(key, String(value));
  }
  const s = qs.toString();
  return s ? `?${s}` : "";
}

function errorOf(e: unknown, fallback: string): AdminErr {
  if (e instanceof ApiError) {
    return {
      ok: false,
      message: e.message || fallback,
      fields: e.fields,
    };
  }
  return { ok: false, message: fallback };
}

function unwrapList<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[];
  if (payload !== null && typeof payload === "object") {
    const data = (payload as { data?: unknown }).data;
    if (Array.isArray(data)) return data as T[];
  }
  return [];
}

function unwrapOne<T>(payload: unknown): T | null {
  if (payload !== null && typeof payload === "object" && "data" in payload) {
    const data = (payload as { data: T }).data;
    return data ?? null;
  }
  return (payload as T) ?? null;
}

async function mutate<T>(
  run: () => Promise<unknown>,
  fallback: string,
): Promise<AdminResult<T>> {
  try {
    const data = unwrapOne<T>(await run());
    if (data === null) return { ok: false, message: fallback };
    return { ok: true, data };
  } catch (e) {
    return errorOf(e, fallback);
  }
}

/** For 204/empty-body mutations (deletes, unban): any 2xx is success. */
async function mutateVoid(
  run: () => Promise<unknown>,
  fallback: string,
): Promise<AdminResult<null>> {
  try {
    await run();
    return { ok: true, data: null };
  } catch (e) {
    return errorOf(e, fallback);
  }
}

async function queryList<T>(path: string): Promise<T[]> {
  try {
    return unwrapList<T>(await api.get<unknown>(path));
  } catch {
    return [];
  }
}

/* ---------- challenges ---------- */

export async function listAdminChallenges(params: {
  status?: string;
  q?: string;
  page?: number;
  per_page?: number;
} = {}): Promise<AdminChallengeRow[]> {
  return queryList<AdminChallengeRow>(
    `/admin/challenges${buildQuery(params)}`,
  );
}

export function createAdminChallenge(
  input: AdminChallengeInput,
): Promise<AdminResult<AdminChallengeRow>> {
  return mutate<AdminChallengeRow>(
    () => api.post<unknown>("/admin/challenges", input),
    "Could not create the challenge.",
  );
}

export function updateAdminChallenge(
  id: number,
  input: AdminChallengeInput,
): Promise<AdminResult<AdminChallengeRow>> {
  return mutate<AdminChallengeRow>(
    () => api.put<unknown>(`/admin/challenges/${id}`, input),
    "Could not save the challenge.",
  );
}

export function transitionAdminChallenge(
  id: number,
  action: AdminChallengeTransition,
): Promise<AdminResult<{ status: ContentStatus }>> {
  return mutate<{ status: ContentStatus }>(
    () => api.post<unknown>(`/admin/challenges/${id}/${action}`),
    `Could not ${action} the challenge.`,
  );
}

/* ---------- challenge files (multipart) ---------- */

export function uploadAdminChallengeFile(
  id: number,
  file: File,
): Promise<AdminResult<AdminFileMeta>> {
  const form = new FormData();
  form.append("file", file);
  return mutate<AdminFileMeta>(
    () => api.post<unknown>(`/admin/challenges/${id}/files`, form),
    "Could not upload the file.",
  );
}

export function deleteAdminChallengeFile(
  id: number,
  fileId: number,
): Promise<AdminResult<null>> {
  return mutateVoid(
    () => api.delete<unknown>(`/admin/challenges/${id}/files/${fileId}`),
    "Could not delete the file.",
  );
}

/* ---------- hints ---------- */

export function listAdminChallengeHints(
  id: number,
): Promise<AdminHint[]> {
  return queryList<AdminHint>(`/admin/challenges/${id}/hints`);
}

export function createAdminChallengeHint(
  id: number,
  input: AdminHintInput,
): Promise<AdminResult<AdminHint>> {
  return mutate<AdminHint>(
    () => api.post<unknown>(`/admin/challenges/${id}/hints`, input),
    "Could not create the hint.",
  );
}

export function updateAdminChallengeHint(
  id: number,
  hintId: number,
  input: AdminHintInput,
): Promise<AdminResult<AdminHint>> {
  return mutate<AdminHint>(
    () => api.put<unknown>(`/admin/challenges/${id}/hints/${hintId}`, input),
    "Could not save the hint.",
  );
}

export function deleteAdminChallengeHint(
  id: number,
  hintId: number,
): Promise<AdminResult<null>> {
  return mutateVoid(
    () => api.delete<unknown>(`/admin/challenges/${id}/hints/${hintId}`),
    "Could not delete the hint.",
  );
}

/* ---------- flags (write-only values) ---------- */

export function listAdminChallengeFlags(
  id: number,
): Promise<AdminFlagRef[]> {
  return queryList<AdminFlagRef>(`/admin/challenges/${id}/flags`);
}

export function createAdminChallengeFlag(
  id: number,
  input: AdminFlagInput,
): Promise<AdminResult<AdminFlagRef>> {
  return mutate<AdminFlagRef>(
    () => api.post<unknown>(`/admin/challenges/${id}/flags`, input),
    "Could not create the flag.",
  );
}

export function updateAdminChallengeFlag(
  id: number,
  flagId: number,
  input: AdminFlagInput,
): Promise<AdminResult<AdminFlagRef>> {
  return mutate<AdminFlagRef>(
    () => api.put<unknown>(`/admin/challenges/${id}/flags/${flagId}`, input),
    "Could not save the flag.",
  );
}

/* ---------- users ---------- */

export async function listAdminUsers(params: {
  q?: string;
  page?: number;
  per_page?: number;
} = {}): Promise<AdminUserRow[]> {
  return queryList<AdminUserRow>(`/admin/users${buildQuery(params)}`);
}

export function banAdminUser(
  id: number,
  reason: string,
): Promise<AdminResult<AdminUserRow>> {
  return mutate<AdminUserRow>(
    () => api.post<unknown>(`/admin/users/${id}/ban`, { reason }),
    "Could not ban the user.",
  );
}

export function unbanAdminUser(id: number): Promise<AdminResult<AdminUserRow>> {
  return mutate<AdminUserRow>(
    () => api.post<unknown>(`/admin/users/${id}/unban`),
    "Could not unban the user.",
  );
}

export function setAdminUserRole(
  id: number,
  role: Role,
): Promise<AdminResult<AdminUserRow>> {
  return mutate<AdminUserRow>(
    () => api.put<unknown>(`/admin/users/${id}/role`, { role }),
    "Could not change the role.",
  );
}

export function adjustAdminUserXp(
  id: number,
  amount: number,
  reason: string,
): Promise<AdminResult<AdminUserRow>> {
  return mutate<AdminUserRow>(
    () => api.post<unknown>(`/admin/users/${id}/xp`, { amount, reason }),
    "Could not adjust XP.",
  );
}

/* ---------- audit log (read-only) ---------- */

export async function listAdminAuditLogs(params: {
  action?: string;
  page?: number;
  per_page?: number;
} = {}): Promise<AdminAuditEntry[]> {
  return queryList<AdminAuditEntry>(`/admin/audit-logs${buildQuery(params)}`);
}

/* ---------- paths (minimal) ---------- */

export async function listAdminPaths(): Promise<AdminPathRow[]> {
  return queryList<AdminPathRow>("/admin/paths");
}

export function createAdminPath(
  input: AdminPathInput,
): Promise<AdminResult<AdminPathRow>> {
  return mutate<AdminPathRow>(
    () => api.post<unknown>("/admin/paths", input),
    "Could not create the path.",
  );
}

export function transitionAdminPath(
  id: number,
  action: AdminPathTransition,
): Promise<AdminResult<{ status: ContentStatus }>> {
  return mutate<{ status: ContentStatus }>(
    () => api.post<unknown>(`/admin/paths/${id}/${action}`),
    `Could not ${action} the path.`,
  );
}

/* ---------- taxonomy (for authoring selects) ---------- */

export async function listCategoriesAdmin(): Promise<Category[]> {
  try {
    const res = await api.get<Paginated<Category> | { data: Category[] }>(
      "/categories",
    );
    return unwrapList<Category>(res);
  } catch {
    return [];
  }
}

/* ---------- duplication ---------- */

export interface AdminDuplicateRef {
  id: number;
  slug: string;
  title: string;
  status: ContentStatus;
}

export function duplicateAdminChallenge(id: number): Promise<AdminResult<AdminDuplicateRef>> {
  return mutate<AdminDuplicateRef>(
    () => api.post<unknown>(`/admin/challenges/${id}/duplicate`),
    "Could not duplicate the challenge.",
  );
}

export function duplicateAdminPath(id: number): Promise<AdminResult<AdminDuplicateRef>> {
  return mutate<AdminDuplicateRef>(
    () => api.post<unknown>(`/admin/paths/${id}/duplicate`),
    "Could not duplicate the path.",
  );
}


/* ---------- curriculum: modules / lessons / quizzes ---------- */
/* ---------- curriculum authoring: lessons, challenges, quizzes ---------- */

export async function getAdminModule(moduleId: number): Promise<AdminModule | null> {
  try {
    const res = await api.get<{ data: AdminModule }>(`/admin/modules/${moduleId}`);
    return res.data ?? null;
  } catch {
    return null;
  }
}

export async function listAdminLessons(moduleId: number): Promise<AdminLesson[]> {
  try {
    const res = await api.get<{ data: AdminLesson[] }>(`/admin/modules/${moduleId}/lessons`);
    return unwrapList<AdminLesson>(res);
  } catch {
    return [];
  }
}

export function createAdminLesson(
  moduleId: number,
  input: { title: string; summary?: string | null; content: string; position?: number; estimated_minutes?: number; is_published?: boolean },
): Promise<AdminResult<AdminLesson>> {
  return mutate<AdminLesson>(
    () => api.post<unknown>(`/admin/modules/${moduleId}/lessons`, input),
    "Could not create the lesson.",
  );
}

export function updateAdminLesson(
  id: number,
  input: Partial<{ title: string; summary: string | null; content: string; position: number; estimated_minutes: number; is_published: boolean }>,
): Promise<AdminResult<AdminLesson>> {
  return mutate<AdminLesson>(
    () => api.put<unknown>(`/admin/lessons/${id}`, input),
    "Could not save the lesson.",
  );
}

export function deleteAdminLesson(id: number): Promise<AdminResult<null>> {
  return mutateVoid(
    () => api.delete<unknown>(`/admin/lessons/${id}`),
    "Could not delete the lesson.",
  );
}

/* ---------- lesson <-> challenge linking ---------- */

export async function listAdminLessonChallenges(lessonId: number): Promise<AdminLinkedChallenge[]> {
  try {
    const res = await api.get<{ data: AdminLinkedChallenge[] }>(`/admin/lessons/${lessonId}/challenges`);
    return Array.isArray(res.data) ? res.data : [];
  } catch {
    return [];
  }
}

export function linkAdminLessonChallenge(
  lessonId: number,
  challengeId: number,
): Promise<AdminResult<null>> {
  return mutateVoid(
    () => api.post<unknown>(`/admin/lessons/${lessonId}/challenges`, { challenge_id: challengeId }),
    "Could not link the challenge.",
  );
}

export function unlinkAdminLessonChallenge(
  lessonId: number,
  challengeId: number,
): Promise<AdminResult<null>> {
  return mutateVoid(
    () => api.delete<unknown>(`/admin/lessons/${lessonId}/challenges/${challengeId}`),
    "Could not unlink the challenge.",
  );
}

/* ---------- lessons (full detail incl. quiz) ---------- */

export async function getAdminLesson(lessonId: number): Promise<AdminLesson | null> {
  try {
    const res = await api.get<{ data: AdminLesson }>(`/admin/lessons/${lessonId}`);
    return res.data ?? null;
  } catch {
    return null;
  }
}

export function createLessonQuiz(
  lessonId: number,
  input: { title: string; description?: string | null; pass_score?: number; position?: number; is_published?: boolean },
): Promise<AdminResult<AdminQuiz>> {
  return mutate<AdminQuiz>(
    () => api.post<unknown>(`/admin/lessons/${lessonId}/quizzes`, input),
    "Could not create the quiz.",
  );
}

export async function getAdminQuiz(quizId: number): Promise<AdminQuiz | null> {
  try {
    const res = await api.get<{ data: AdminQuiz }>(`/admin/quizzes/${quizId}`);
    return res.data ?? null;
  } catch {
    return null;
  }
}

export function updateAdminQuiz(
  quizId: number,
  input: Partial<{ title: string; description: string | null; pass_score: number; position: number; is_published: boolean }>,
): Promise<AdminResult<AdminQuiz>> {
  return mutate<AdminQuiz>(
    () => api.put<unknown>(`/admin/quizzes/${quizId}`, input),
    "Could not save the quiz.",
  );
}

export function deleteAdminQuiz(quizId: number): Promise<AdminResult<null>> {
  return mutateVoid(
    () => api.delete<unknown>(`/admin/quizzes/${quizId}`),
    "Could not delete the quiz.",
  );
}

/* ---------- quiz questions ---------- */

export function createQuizQuestion(
  quizId: number,
  input: { question: string; type: AdminQuizQuestionType; explanation?: string | null; points?: number; position?: number; is_published?: boolean },
): Promise<AdminResult<AdminQuizQuestion>> {
  return mutate<AdminQuizQuestion>(
    () => api.post<unknown>(`/admin/quizzes/${quizId}/questions`, input),
    "Could not create the question.",
  );
}

export function updateQuizQuestion(
  quizId: number,
  questionId: number,
  input: Partial<{ question: string; type: AdminQuizQuestionType; explanation: string | null; points: number; position: number; is_published: boolean }>,
): Promise<AdminResult<AdminQuizQuestion>> {
  return mutate<AdminQuizQuestion>(
    () => api.put<unknown>(`/admin/quizzes/${quizId}/questions/${questionId}`, input),
    "Could not save the question.",
  );
}

export function deleteQuizQuestion(
  quizId: number,
  questionId: number,
): Promise<AdminResult<null>> {
  return mutateVoid(
    () => api.delete<unknown>(`/admin/quizzes/${quizId}/questions/${questionId}`),
    "Could not delete the question.",
  );
}

/* ---------- quiz options ---------- */

export function createQuizOption(
  questionId: number,
  input: { option_text: string; is_correct?: boolean; position?: number },
): Promise<AdminResult<AdminQuizOption>> {
  return mutate<AdminQuizOption>(
    () => api.post<unknown>(`/admin/questions/${questionId}/options`, input),
    "Could not create the option.",
  );
}

export function updateQuizOption(
  questionId: number,
  optionId: number,
  input: Partial<{ option_text: string; is_correct: boolean; position: number }>,
): Promise<AdminResult<AdminQuizOption>> {
  return mutate<AdminQuizOption>(
    () => api.put<unknown>(`/admin/questions/${questionId}/options/${optionId}`, input),
    "Could not save the option.",
  );
}

export function deleteQuizOption(
  questionId: number,
  optionId: number,
): Promise<AdminResult<null>> {
  return mutateVoid(
    () => api.delete<unknown>(`/admin/questions/${questionId}/options/${optionId}`),
    "Could not delete the option.",
  );
}

