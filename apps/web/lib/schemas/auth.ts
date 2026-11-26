import { z } from "zod";

/**
 * Client-side mirrors of the Laravel FormRequests. They give immediate,
 * accessible feedback but never decide what is valid — the API does.
 */
export const loginSchema = z.object({
  email: z.email("Enter a valid email address."),
  password: z.string().min(1, "Password is required."),
});

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Use at least 2 characters.").max(255, "Name is too long."),
  email: z.email("Enter a valid email address."),
  password: z.string().min(12, "Use at least 12 characters."),
  password_confirmation: z.string().min(1, "Confirm your password."),
}).refine((data) => data.password === data.password_confirmation, {
  path: ["password_confirmation"],
  message: "Passwords do not match.",
});

export const forgotPasswordSchema = z.object({
  email: z.email("Enter a valid email address."),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "This reset link is invalid."),
  email: z.email("Enter a valid email address."),
  password: z.string().min(12, "Use at least 12 characters."),
  password_confirmation: z.string().min(1, "Confirm your password."),
}).refine((data) => data.password === data.password_confirmation, {
  path: ["password_confirmation"],
  message: "Passwords do not match.",
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
