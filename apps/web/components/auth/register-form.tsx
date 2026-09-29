"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { api, ApiError } from "@/lib/api/client";
import { errorMessage, fieldError } from "@/lib/errors";
import type { AuthResponse } from "@/lib/types";

export function RegisterForm() {
  const id = useId();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setErrors({});
    startTransition(async () => {
      try {
        await api.post<{ data: AuthResponse }>(
          "/auth/register",
          {
            name,
            email,
            password,
            password_confirmation: passwordConfirmation,
          },
        );
        router.push("/dashboard");
        router.refresh();
      } catch (err) {
        setFormError(errorMessage(err, "Registration failed."));
        if (err instanceof ApiError && err.fields) {
          setErrors({
            name: fieldError(err, "name") ?? "",
            email: fieldError(err, "email") ?? "",
            password: fieldError(err, "password") ?? "",
          });
        }
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate data-testid="register-form">
      <div className="space-y-1 text-center">
        <h1 className="font-display text-2xl font-semibold">Create account</h1>
        <p className="text-sm text-muted">
          Join Catch The Flag — structured paths and static CTF challenges.
        </p>
      </div>

      {formError ? (
        <p role="alert" className="text-sm text-danger">
          {formError}
        </p>
      ) : null}

      <Field label="Name" htmlFor={`${id}-name`} error={errors.name || undefined}>
        <Input
          id={`${id}-name`}
          name="name"
          autoComplete="name"
          required
          minLength={2}
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={pending}
        />
      </Field>

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
          autoComplete="new-password"
          required
          minLength={12}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={pending}
        />
      </Field>
      <p className="text-xs text-faint">At least 12 characters, with letters and numbers.</p>

      <Field label="Confirm password" htmlFor={`${id}-confirm`}>
        <Input
          id={`${id}-confirm`}
          name="password_confirmation"
          type="password"
          autoComplete="new-password"
          required
          value={passwordConfirmation}
          onChange={(e) => setPasswordConfirmation(e.target.value)}
          disabled={pending}
        />
      </Field>

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Creating…" : "Create account"}
      </Button>

      <p className="text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href="/login" className="text-accent hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
