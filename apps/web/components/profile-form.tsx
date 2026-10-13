"use client";

import { useRouter } from "next/navigation";
import { useId, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";
import { api } from "@/lib/api/client";
import { errorMessage } from "@/lib/errors";
import type { CurrentUser } from "@/lib/types";

export function ProfileForm({ user }: { user: CurrentUser }) {
  const id = useId();
  const router = useRouter();
  const [name, setName] = useState(user.name);
  const [bio, setBio] = useState(user.bio ?? "");
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
            await api.put("/profile", { name, bio: bio || null });
            setMessage("Profile updated.");
            router.refresh();
          } catch (err) {
            setError(errorMessage(err));
          }
        });
      }}
    >
      <Field label="Name" htmlFor={`${id}-name`}>
        <Input
          id={`${id}-name`}
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          minLength={2}
          disabled={pending}
        />
      </Field>
      <Field label="Bio" htmlFor={`${id}-bio`}>
        <Textarea
          id={`${id}-bio`}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          maxLength={500}
          disabled={pending}
        />
      </Field>
      <p className="text-sm text-muted">
        Email: <span className="text-foreground">{user.email}</span>
      </p>
      {message ? <p className="text-sm text-success" role="status">{message}</p> : null}
      {error ? (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save profile"}
      </Button>
    </form>
  );
}
