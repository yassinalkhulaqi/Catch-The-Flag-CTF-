"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PasswordRequirements } from "@/components/auth/password-requirements";
import { Button } from "@/components/ui/button";
import { Form, FormError } from "@/components/ui/form";
import { Field, Input } from "@/components/ui/input";
import { api } from "@/lib/api/client";
import { applyServerError } from "@/lib/forms/server-errors";
import { registerSchema, type RegisterInput } from "@/lib/schemas/auth";
import type { AuthResponse } from "@/lib/types";

export function RegisterForm() {
  const id = useId();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "", password_confirmation: "" },
  });
  const password = form.watch("password");
  const confirmation = form.watch("password_confirmation");

  const onSubmit = form.handleSubmit((values) => {
    setFormError(null);
    startTransition(async () => {
      try {
        await api.post<{ data: AuthResponse }>("/auth/register", values);
        router.push("/dashboard");
        router.refresh();
      } catch (err) {
        setFormError(applyServerError(err, form.setError));
      }
    });
  });

  return (
    <Form label="Create account" onSubmit={onSubmit} pending={pending} data-testid="register-form">
      <div className="space-y-1 text-center">
        <h1 className="font-display text-2xl font-semibold">Create account</h1>
        <p className="text-sm text-muted">
          Join Catch The Flag — structured paths and static CTF challenges.
        </p>
      </div>

      <FormError>{formError}</FormError>

      <Field label="Name" htmlFor={`${id}-name`} error={form.formState.errors.name?.message}>
        <Input id={`${id}-name`} autoComplete="name" disabled={pending} {...form.register("name")} />
      </Field>

      <Field label="Email" htmlFor={`${id}-email`} error={form.formState.errors.email?.message}>
        <Input id={`${id}-email`} type="email" autoComplete="email" disabled={pending} {...form.register("email")} />
      </Field>

      <Field label="Password" htmlFor={`${id}-password`} error={form.formState.errors.password?.message}>
        <Input
          id={`${id}-password`}
          type="password"
          autoComplete="new-password"
          disabled={pending}
          {...form.register("password")}
        />
      </Field>
      <PasswordRequirements password={password} confirmation={confirmation} />

      <Field
        label="Confirm password"
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

      <Button type="submit" loading={pending} className="w-full">
        Create account
      </Button>

      <p className="text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href="/login" className="text-accent hover:underline">
          Sign in
        </Link>
      </p>
    </Form>
  );
}
