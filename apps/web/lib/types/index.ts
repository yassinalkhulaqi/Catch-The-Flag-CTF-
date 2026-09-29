/**
 * Types mirroring the Laravel API Resources (docs/api.md).
 * Keep in sync when resources change — the backend is the source of truth.
 */

export type Difficulty = "beginner" | "intermediate" | "advanced" | "expert";
export type ContentStatus = "draft" | "review" | "published" | "archived";
export type Role = "user" | "moderator" | "admin";
export type PathProgressStatus = "in_progress" | "completed";

/* ---------- envelope ---------- */

export interface PaginationMeta {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
}

export interface Paginated<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    fields?: Record<string, string[]>;
    request_id?: string;
  };
}

/* ---------- identity ---------- */

export interface CurrentUser {
  id: number;
  name: string;
  email: string;
  role: Role;
  xp: number;
  solved_count: number;
  bio: string | null;
  avatar_url: string | null;
  created_at: string;
  achievements_count?: number;
  /** Present on admin user list/detail responses only. */
  banned_at?: string | null;
}

export interface AuthResponse {
  user: CurrentUser;
  expires_at: string;
  /** Server-to-server only — stripped by the BFF, never sent to the browser. */
  token?: string;
}

/* ---------- taxonomy ---------- */

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  color: string | null;
  icon: string | null;
  challenge_count?: number;
}

export interface Tag {
  id: number;
  name: string;
  slug: string;
}

/* ---------- learning ---------- */

export interface PathSummary {
  id: number;
  title: string;
  slug: string;
  summary: string;
  difficulty: Difficulty;
  category: Pick<Category, "id" | "name" | "slug" | "color"> | null;
  thumbnail_url: string | null;
  estimated_minutes: number;
  module_count: number;
  lesson_count: number;
  challenge_count: number;
  progress_percent: number;
  status: ContentStatus;
}

export interface PathModule {
  id: number;
  title: string;
  description: string | null;
  position: number;
  lesson_count: number;
  challenge_count: number;
  completed_lesson_count: number;
}

export interface PathDetail extends PathSummary {
  description: string | null;
  prerequisites: Array<Pick<PathSummary, "id" | "title" | "slug">>;
  modules: PathModule[];
  completed: boolean;
}

export interface LessonChallengeRef {
  id: number;
  title: string;
  slug: string;
  points: number;
  difficulty: Difficulty;
  solved: boolean;
}

export interface Lesson {
  id: number;
  module_id: number;
  title: string;
  slug: string;
  summary: string | null;
  content: string;
  position: number;
  estimated_minutes: number;
  completed: boolean;
  challenges: LessonChallengeRef[];
  quiz: { id: number; title: string; passed: boolean } | null;
  prev_lesson_id: number | null;
  next_lesson_id: number | null;
}

export interface ModuleLesson {
  id: number;
  title: string;
  slug: string;
  position: number;
  completed: boolean;
  estimated_minutes: number;
}

export interface ModuleDetail {
  id: number;
  path_id: number;
  title: string;
  description: string | null;
  position: number;
  lessons: ModuleLesson[];
}

/* ---------- quiz ---------- */

export type QuizQuestionType = "single" | "multiple" | "true_false";

export interface QuizOption {
  id: number;
  option_text: string;
}

export interface QuizQuestion {
  id: number;
  question: string;
  type: QuizQuestionType;
  points: number;
  position: number;
  options: QuizOption[]; // never includes is_correct
  explanation?: string | null; // only after submit
  answered?: { selected_option_ids: number[]; is_correct: boolean } | null;
}

export interface Quiz {
  id: number;
  title: string;
  description: string | null;
  pass_score: number;
  questions: QuizQuestion[];
}

export interface QuizAttemptResult {
  id: number;
  score: number;
  passed: boolean;
  correct_count: number;
  total: number;
}

/* ---------- challenges ---------- */

export interface ChallengeFile {
  id: number;
  original_name: string;
  mime_type: string;
  size_bytes: number;
  checksum_sha256: string;
  download_url: string;
}

export interface ChallengeHint {
  id: number;
  position: number;
  cost_points: number;
  unlocked: boolean;
  content?: string; // only when unlocked
}

export interface ChallengeSummary {
  id: number;
  title: string;
  slug: string;
  category: Pick<Category, "id" | "name" | "slug" | "color">;
  difficulty: Difficulty;
  points: number;
  estimated_minutes: number;
  tags: Tag[];
  solved: boolean;
  solve_count: number;
  status: ContentStatus;
}

export interface ChallengeDetail extends ChallengeSummary {
  description: string;
  scenario: string | null;
  files: ChallengeFile[];
  hints: ChallengeHint[];
  author: { id: number; name: string } | null;
  published_at: string | null;
  points_remaining: number; // after hints unlocked by me
  related?: ChallengeSummary[];
}

export type SubmissionResultKind = "correct" | "incorrect";

export interface SubmissionOutcome {
  result: SubmissionResultKind;
  points_awarded?: number;
  already_solved?: boolean;
  xp_total?: number;
}

export interface SolveEntry {
  id: number;
  challenge: ChallengeSummary;
  points_awarded: number;
  hints_used: number;
  solved_at: string;
}

/* ---------- progression ---------- */

export interface XpEntry {
  id: number;
  amount: number;
  reason: string;
  description: string;
  created_at: string;
}

export interface Achievement {
  id: number;
  key: string;
  title: string;
  description: string;
  icon: string | null;
  awarded?: boolean;
  awarded_at?: string | null;
  progress?: { current: number; target: number };
}

export interface LeaderboardEntry {
  rank: number;
  id: number;
  name: string;
  xp: number;
  solved_count: number;
  achievements_count: number;
}

export interface ProgressOverview {
  paths_started: number;
  paths_completed: number;
  lessons_completed: number;
  challenges_solved: number;
  xp: number;
  rank: number | null;
  streak_days: number;
}

export interface NotificationItem {
  id: string;
  type: string;
  data: { title: string; body?: string; url?: string };
  read_at: string | null;
  created_at: string;
}

/* ---------- admin ---------- */

export interface AdminStats {
  users: number;
  challenges_published: number;
  paths_published: number;
  solves_total: number;
}

export interface ChallengeFlagMeta {
  id: number;
  label: string | null;
  case_sensitive: boolean;
  is_active: boolean;
  created_at: string;
}

export interface AuditLogEntry {
  id: number;
  actor_id: number | null;
  actor?: { id: number; name: string } | null;
  action: string;
  auditable_type: string | null;
  auditable_id: number | null;
  changes: Record<string, unknown> | null;
  created_at: string;
}

export interface UserSettings {
  email: string;
  theme: "system" | "light" | "dark";
}
