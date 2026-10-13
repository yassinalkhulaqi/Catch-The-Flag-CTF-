"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { ApiError, api } from "@/lib/api/client";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      await api.post("/auth/forgot-password", { email });
      setSent(true);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Request failed. Try again.",
      );
    } finally {
      setPending(false);
    }
  }

  if (sent) {
    return (
      <div aria-live="polite">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Check your inbox
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted">
          If an account exists for {email}, a reset link valid for 60 minutes
          is on its way.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-block text-sm text-accent hover:underline"
        >
          Back to log in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" aria-label="Forgot password">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
        Reset your password
      </h1>
      <Field label="Email" htmlFor="forgot-email">
        <Input
          id="forgot-email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />
      </Field>
      {error ? (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Sending…" : "Send reset link"}
      </Button>
      <p className="text-center text-sm text-muted">
        <Link href="/login" className="text-accent hover:underline">
          Back to log in
        </Link>
      </p>
    </form>
  );
}
