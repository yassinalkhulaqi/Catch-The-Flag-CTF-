import { z } from "zod";

const integer = z.coerce.number().int();

export const challengeFiltersSchema = z.object({
  q: z.string().max(255).optional(),
  category: z.string().max(80).optional(),
  difficulty: z.enum(["beginner", "intermediate", "advanced", "expert"]).optional(),
  tags: z.array(z.string().max(80)).max(20).optional(),
  min_points: integer.min(1).max(10000).optional(),
  max_points: integer.min(1).max(10000).optional(),
  solved: z.enum(["true", "false", "1", "0"]).optional(),
  status: z.enum(["draft", "review", "published", "archived"]).optional(),
  sort: z.enum(["points", "-points", "created_at", "-created_at", "title", "-title", "solve_count", "-solve_count"]).optional(),
  per_page: integer.min(1).max(100).optional(),
  page: integer.min(1).optional(),
});

export type ChallengeFiltersInput = z.infer<typeof challengeFiltersSchema>;
