"use client";

import { useId, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PasswordRequirements } from "@/components/auth/password-requirements";
import { Button } from "@/components/ui/button";
import { Form, FormError, FormSuccess } from "@/components/ui/form";
import { Field, Input } from "@/components/ui/input";
import { api } from "@/lib/api/client";
import { applyServerError } from "@/lib/forms/server-errors";
import { passwordSchema, type PasswordInput } from "@/lib/schemas/profile";

export function PasswordForm() {
  const id = useId();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const form = useForm<PasswordInput>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { current_password: "", password: "", password_confirmation: "" },
  });
  const password = form.watch("password");
  const confirmation = form.watch("password_confirmation");

  const onSubmit = form.handleSubmit((values) => {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      try {
        await api.put("/profile/password", values);
        setMessage("Password updated. Other sessions were signed out.");
        form.reset();
      } catch (err) {
        setError(applyServerError(err, form.setError));
      }
    });
  });

  return (
    <Form label="Change password" onSubmit={onSubmit} pending={pending} className="max-w-lg">
      <Field label="Current password" htmlFor={`${id}-current`} error={form.formState.errors.current_password?.message}>
        <Input
          id={`${id}-current`}
          type="password"
          autoComplete="current-password"
          disabled={pending}
          {...form.register("current_password")}
        />
      </Field>
      <Field label="New password" htmlFor={`${id}-new`} error={form.formState.errors.password?.message}>
        <Input
          id={`${id}-new`}
          type="password"
          autoComplete="new-password"
          disabled={pending}
          {...form.register("password")}
        />
      </Field>
      <PasswordRequirements password={password} confirmation={confirmation} />
      <Field
        label="Confirm new password"
        htmlFor={`${id}-confirm`}
        error={form.formState.errors.password_confirmation?.message}
      >
        <Input
          id={`${id}-confirm`}
          type="password"
          autoComplete="new-password"
          disabled={pending}
          {...form.register("password_confirmation")}
        />
      </Field>
      <FormSuccess>{message}</FormSuccess>
      <FormError>{error}</FormError>
      <Button type="submit" loading={pending}>
        Update password
      </Button>
    </Form>
  );
}
