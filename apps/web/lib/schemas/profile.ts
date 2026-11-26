import { z } from "zod";

export const profileSchema = z.object({
  name: z.string().trim().min(2, "Use at least 2 characters.").max(255, "Name is too long."),
  bio: z.string().max(500, "Keep your bio at 500 characters or fewer."),
});

export const passwordSchema = z.object({
  current_password: z.string().min(1, "Enter your current password."),
  password: z.string().min(12, "Use at least 12 characters."),
  password_confirmation: z.string().min(1, "Confirm your new password."),
}).refine((data) => data.password === data.password_confirmation, {
  path: ["password_confirmation"],
  message: "Passwords do not match.",
});

export const noteSchema = z.object({
  note: z.string().max(2000, "Keep the note under 2000 characters."),
});

export type ProfileInput = z.infer<typeof profileSchema>;
export type NoteInput = z.infer<typeof noteSchema>;
export type PasswordInput = z.infer<typeof passwordSchema>;
