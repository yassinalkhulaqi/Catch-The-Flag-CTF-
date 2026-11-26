"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PasswordRequirements } from "@/components/auth/password-requirements";
import { Button } from "@/components/ui/button";
import { Form, FormError } from "@/components/ui/form";
import { Field, Input } from "@/components/ui/input";
import { api } from "@/lib/api/client";
import { applyServerError } from "@/lib/forms/server-errors";
import { resetPasswordSchema, type ResetPasswordInput } from "@/lib/schemas/auth";

export function ResetPasswordForm({ token, email }: { token: string; email: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token, email, password: "", password_confirmation: "" },
  });
  const password = form.watch("password");
  const confirmation = form.watch("password_confirmation");

  const onSubmit = form.handleSubmit((values) => {
    setFormError(null);
    startTransition(async () => {
      try {
        await api.post("/auth/reset-password", values);
        router.push("/login");
        router.refresh();
      } catch (err) {
        setFormError(applyServerError(err, form.setError));
      }
    });
  });

  return (
    <Form label="Set new password" onSubmit={onSubmit} pending={pending}>
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
        Choose a new password
      </h1>
      <Field label="New password" htmlFor="reset-password" error={form.formState.errors.password?.message}>
        <Input
          id="reset-password"
          type="password"
          autoComplete="new-password"
          disabled={pending}
          {...form.register("password")}
        />
      </Field>
      <PasswordRequirements password={password} confirmation={confirmation} />
      <Field
        label="Confirm new password"
        htmlFor="reset-confirm"
        error={form.formState.errors.password_confirmation?.message}
      >
        <Input
          id="reset-confirm"
          type="password"
          autoComplete="new-password"
          disabled={pending}
          {...form.register("password_confirmation")}
        />
      </Field>
      <FormError>{formError}</FormError>
      <Button type="submit" loading={pending} className="w-full">
        Reset password
      </Button>
      <p className="text-center text-sm text-muted">
        <Link href="/login" className="text-accent hover:underline">
          Back to log in
        </Link>
      </p>
    </Form>
  );
}
