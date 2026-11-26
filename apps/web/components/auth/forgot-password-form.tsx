"use client";

import Link from "next/link";
import { useId, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Form, FormError, FormSuccess } from "@/components/ui/form";
import { Field, Input } from "@/components/ui/input";
import { api } from "@/lib/api/client";
import { applyServerError } from "@/lib/forms/server-errors";
import { forgotPasswordSchema, type ForgotPasswordInput } from "@/lib/schemas/auth";

export function ForgotPasswordForm() {
  const id = useId();
  const [pending, startTransition] = useTransition();
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = form.handleSubmit((values) => {
    setError(null);
    startTransition(async () => {
      try {
        await api.post("/auth/forgot-password", values);
        setSent(true);
      } catch (err) {
        setError(applyServerError(err, form.setError));
      }
    });
  });

  return (
    <Form label="Reset your password" onSubmit={onSubmit} pending={pending}>
      <div className="space-y-1 text-center">
        <h1 className="font-display text-2xl font-semibold">Reset your password</h1>
        <p className="text-sm text-muted">
          We always show the same confirmation, so this form does not reveal which emails exist.
        </p>
      </div>
      {sent ? (
        <FormSuccess>If an account exists for that email, a reset link is on its way.</FormSuccess>
      ) : (
        <>
          <FormError>{error}</FormError>
          <Field label="Email" htmlFor={`${id}-email`} error={form.formState.errors.email?.message ?? error ?? undefined}>
            <Input
              id={`${id}-email`}
              type="email"
              autoComplete="email"
              disabled={pending}
              {...form.register("email")}
            />
          </Field>
          <Button type="submit" loading={pending} className="w-full">
            Send reset link
          </Button>
        </>
      )}
      <p className="text-center text-sm text-muted">
        <Link href="/login" className="text-accent hover:underline">
          Back to sign in
        </Link>
      </p>
    </Form>
  );
}
