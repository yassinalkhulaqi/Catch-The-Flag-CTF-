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

export type ChallengeBasicsInput = z.infer<typeof challengeBasicsSchema>;
export type PathCreateInput = z.infer<typeof pathCreateSchema>;
