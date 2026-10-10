"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useId, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { api, ApiError } from "@/lib/api/client";
import { errorMessage, fieldError } from "@/lib/errors";
import { safeInternalPath } from "@/lib/safe-url";
import type { AuthResponse } from "@/lib/types";

export function LoginForm() {
  const id = useId();
  const router = useRouter();
  const search = useSearchParams();
  const next = safeInternalPath(search.get("next"), "/dashboard");
  const [pending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setErrors({});
    startTransition(async () => {
      try {
        await api.post<{ data: AuthResponse }>("/auth/login", { email, password });
        router.push(next);
        router.refresh();
      } catch (err) {
        setFormError(errorMessage(err, "Login failed."));
        if (err instanceof ApiError && err.fields) {
          setErrors({
            email: fieldError(err, "email") ?? "",
            password: fieldError(err, "password") ?? "",
          });
        }
      }
    });
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-4"
      data-testid="login-form"
      noValidate
    >
      <div className="space-y-1 text-center">
        <h1 className="font-display text-2xl font-semibold">Welcome back</h1>
        <p className="text-sm text-muted">Sign in to continue learning and hunting.</p>
      </div>

      {formError ? (
        <p role="alert" className="text-sm text-danger" data-testid="login-error">
          {formError}
        </p>
      ) : null}

      <Field label="Email" htmlFor={`${id}-email`} error={errors.email || undefined}>
        <Input
          id={`${id}-email`}
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={pending}
          data-testid="login-email"
        />
      </Field>

      <Field
        label="Password"
        htmlFor={`${id}-password`}
        error={errors.password || undefined}
      >
        <Input
          id={`${id}-password`}
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={pending}
          data-testid="login-password"
        />
      </Field>

      <Button type="submit" className="w-full" disabled={pending} data-testid="login-submit">
        {pending ? "Signing in…" : "Sign in"}
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
    </form>
  );
}
