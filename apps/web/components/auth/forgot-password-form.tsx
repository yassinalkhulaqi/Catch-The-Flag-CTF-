"use client";

import Link from "next/link";
import { useId, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { api } from "@/lib/api/client";
import { errorMessage } from "@/lib/errors";

export function ForgotPasswordForm() {
  const id = useId();
  const [email, setEmail] = useState("");
  const [pending, startTransition] = useTransition();
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        setError(null);
        startTransition(async () => {
          try {
            await api.post("/auth/forgot-password", { email });
            setSent(true);
          } catch (err) {
            setError(errorMessage(err, "Could not send a reset link."));
          }
        });
      }}
    >
      <div className="space-y-1 text-center">
        <h1 className="font-display text-2xl font-semibold">Reset your password</h1>
        <p className="text-sm text-muted">
          We always show the same confirmation, so this form does not reveal which emails exist.
        </p>
      </div>
      {sent ? (
        <p role="status" className="text-sm text-success">
          If an account exists for that email, a reset link is on its way.
        </p>
      ) : (
        <>
          <Field label="Email" htmlFor={`${id}-email`} error={error ?? undefined}>
            <Input
              id={`${id}-email`}
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={pending}
            />
          </Field>
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Sending…" : "Send reset link"}
          </Button>
        </>
      )}
      <p className="text-center text-sm text-muted">
        <Link href="/login" className="text-accent hover:underline">
          Back to sign in
        </Link>
      </p>
    </form>
  );
}
