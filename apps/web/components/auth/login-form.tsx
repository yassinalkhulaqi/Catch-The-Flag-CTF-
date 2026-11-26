"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useId, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Form, FormError } from "@/components/ui/form";
import { Field, Input } from "@/components/ui/input";
import { api } from "@/lib/api/client";
import { applyServerError } from "@/lib/forms/server-errors";
import { useDictionary } from "@/lib/i18n";
import { loginSchema, type LoginInput } from "@/lib/schemas/auth";
import { safeInternalPath } from "@/lib/safe-url";
import type { AuthResponse } from "@/lib/types";

export function LoginForm() {
  const id = useId();
  const router = useRouter();
  const search = useSearchParams();
  const copy = useDictionary();
  const next = safeInternalPath(search.get("next"), "/dashboard");
  const [pending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = form.handleSubmit((values) => {
    setFormError(null);
    startTransition(async () => {
      try {
        await api.post<{ data: AuthResponse }>("/auth/login", values);
        router.push(next);
        router.refresh();
      } catch (err) {
        setFormError(applyServerError(err, form.setError));
      }
    });
  });

  return (
    <Form
      label="Sign in"
      onSubmit={onSubmit}
      pending={pending}
      data-testid="login-form"
    >
      <div className="space-y-1 text-center">
        <h1 className="font-display text-2xl font-semibold">{copy.pages.loginTitle}</h1>
        <p className="text-sm text-muted">{copy.pages.loginBody}</p>
      </div>

      <FormError data-testid="login-error">{formError}</FormError>

      <Field label="Email" htmlFor={`${id}-email`} error={form.formState.errors.email?.message}>
        <Input
          id={`${id}-email`}
          type="email"
          autoComplete="email"
          disabled={pending}
          data-testid="login-email"
          {...form.register("email")}
        />
      </Field>

      <Field label="Password" htmlFor={`${id}-password`} error={form.formState.errors.password?.message}>
        <Input
          id={`${id}-password`}
          type="password"
          autoComplete="current-password"
          disabled={pending}
          data-testid="login-password"
          {...form.register("password")}
        />
      </Field>

      <Button type="submit" loading={pending} className="w-full" data-testid="login-submit">
        Sign in
      </Button>

      <p className="text-center text-sm text-muted">
        No account?{" "}
        <Link href="/register" className="text-accent hover:underline">
          Create one
        </Link>
        <span className="mx-2 text-faint">·</span>
        <Link href="/forgot-password" className="text-accent hover:underline">
          Forgot password?
        </Link>
      </p>
    </Form>
  );
}
