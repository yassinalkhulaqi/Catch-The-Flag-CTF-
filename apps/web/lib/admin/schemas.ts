import { z } from "zod";

const difficulty = z.enum(["beginner", "intermediate", "advanced", "expert"]);

/** Challenge basics the admin editor already sends. Flag plaintext is not in this schema. */
export const challengeBasicsSchema = z.object({
  title: z.string().trim().min(1, "Title is required.").max(160, "Title is too long."),
  slug: z
    .string()
    .trim()
    .min(1, "Slug is required.")
    .max(160)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens."),
  description: z.string().trim().min(1, "Description is required."),
  scenario: z.string().trim().max(20000).nullable(),
  category_id: z.number().int().positive("Choose a category."),
  difficulty,
  points: z.number().int().min(1, "Points must be at least 1.").max(10000),
  tag_ids: z.array(z.number().int()),
});

export const pathCreateSchema = z.object({
  title: z.string().trim().min(1, "Title is required.").max(160),
  slug: z
    .string()
    .trim()
    .min(1, "Slug is required.")
    .max(160)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens."),
  summary: z.string().trim().min(1, "Summary is required.").max(400, "Summary must be 400 characters or fewer."),
  difficulty,
  category_id: z.number().int().positive().nullable(),
});

const slug = z
  .string()
  .trim()
  .min(1, "Slug is required.")
  .max(160)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens.");

/** Client mirrors of the remaining admin FormRequests. Server rules win. */
export const tagCreateSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(80),
  slug: slug.optional(),
});

export const categoryCreateSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(80),
  slug: slug.optional(),
  description: z.string().max(500).optional(),
  color: z.string().max(9).optional(),
  is_active: z.boolean().optional(),
});

export const hintCreateSchema = z.object({
  content: z.string().trim().min(1, "Write the hint first."),
  cost_points: z.number().int().min(0).max(10000),
  position: z.number().int().min(0),
});

export const lessonCreateSchema = z.object({
  title: z.string().trim().min(1, "Title is required.").max(160),
  slug: slug.optional(),
  content: z.string().trim().min(1, "Content is required."),
  estimated_minutes: z.number().int().min(0).optional(),
  is_published: z.boolean().optional(),
});

export const quizCreateSchema = z.object({
  title: z.string().trim().min(1, "Title is required.").max(160),
  description: z.string().optional(),
  pass_score: z.number().int().min(1).max(100).optional(),
  is_published: z.boolean().optional(),
});

export const questionCreateSchema = z.object({
  question: z.string().trim().min(1, "Write the question first."),
  type: z.enum(["single", "multiple", "true_false"]),
  explanation: z.string().optional(),
  points: z.number().int().min(1).max(10000).optional(),
});

const criteriaType = z.enum(["solves_total", "xp_total", "paths_completed", "category_solves", "first_blood"]);

export const achievementCreateSchema = z.object({
  key: z.string().trim().min(1, "A key is required.").max(80).regex(/^[a-z0-9_]+$/, "Use lowercase letters, numbers, and underscores."),
  title: z.string().trim().min(1, "A title is required.").max(160),
  description: z.string().trim().min(1, "A description is required.").max(400),
  icon: z.string().max(60),
  criteria: z.object({
    type: criteriaType,
    threshold: z.number().int().min(1),
    category_id: z.number().int().positive().optional(),
  }),
  points: z.number().int().min(0).max(10000),
  sort_order: z.number().int().min(0).max(10000),
  is_active: z.boolean(),
});

export const achievementEditSchema = achievementCreateSchema.omit({ key: true, is_active: true });
export type AchievementCreateInput = z.infer<typeof achievementCreateSchema>;
export type AchievementEditInput = z.infer<typeof achievementEditSchema>;

export const flagCreateSchema = z.object({
  label: z.string().trim().min(1, "A label is required.").max(120),
  flag: z.string().min(1, "A flag value is required."),
  case_sensitive: z.boolean(),
});

export const flagReplaceSchema = z.object({
  flag: z.string().min(1, "Enter the replacement flag value."),
});

export const banUserSchema = z.object({
  reason: z.string().trim().min(1, "A reason is required.").max(500),
});

export const adjustXpSchema = z.object({
  amount: z.number().int().refine((value) => value !== 0, "Amount cannot be zero."),
  reason: z.string().trim().min(1, "A reason is required.").max(200),
});

export type ChallengeBasicsInput = z.infer<typeof challengeBasicsSchema>;
export type PathCreateInput = z.infer<typeof pathCreateSchema>;
export type TagCreateInput = z.infer<typeof tagCreateSchema>;
export type CategoryCreateInput = z.infer<typeof categoryCreateSchema>;
export type HintCreateInput = z.infer<typeof hintCreateSchema>;
export type LessonCreateInput = z.infer<typeof lessonCreateSchema>;
export type QuizCreateInput = z.infer<typeof quizCreateSchema>;
export type QuestionCreateInput = z.infer<typeof questionCreateSchema>;
export type FlagCreateInput = z.infer<typeof flagCreateSchema>;
export type FlagReplaceInput = z.infer<typeof flagReplaceSchema>;
export type BanUserInput = z.infer<typeof banUserSchema>;
export type AdjustXpInput = z.infer<typeof adjustXpSchema>;
