"use client";

import { useId, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { api } from "@/lib/api/client";
import { errorMessage } from "@/lib/errors";

export function PasswordForm() {
  const id = useId();
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="max-w-lg space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        setMessage(null);
        setError(null);
        startTransition(async () => {
          try {
            await api.put("/profile/password", {
              current_password: currentPassword,
              password,
              password_confirmation: passwordConfirmation,
            });
            setMessage("Password updated. Other sessions were signed out.");
            setCurrentPassword("");
            setPassword("");
            setPasswordConfirmation("");
          } catch (err) {
            setError(errorMessage(err));
          }
        });
      }}
    >
      <Field label="Current password" htmlFor={`${id}-current`}>
        <Input
          id={`${id}-current`}
          type="password"
          autoComplete="current-password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
          disabled={pending}
        />
      </Field>
      <Field label="New password" htmlFor={`${id}-new`}>
        <Input
          id={`${id}-new`}
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={12}
          disabled={pending}
        />
      </Field>
      <Field label="Confirm new password" htmlFor={`${id}-confirm`}>
        <Input
          id={`${id}-confirm`}
          type="password"
          autoComplete="new-password"
          value={passwordConfirmation}
          onChange={(e) => setPasswordConfirmation(e.target.value)}
          required
          disabled={pending}
        />
      </Field>
      {message ? <p className="text-sm text-success" role="status">{message}</p> : null}
      {error ? (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Updating…" : "Update password"}
      </Button>
    </form>
  );
}
