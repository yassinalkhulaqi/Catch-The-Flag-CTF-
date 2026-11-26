import { z } from "zod";

export const flagSchema = z.object({
  flag: z.string().trim().min(1, "Enter a flag to submit.").max(500, "Flag is too long."),
});

export type FlagInput = z.infer<typeof flagSchema>;
