"use client";

import { useRouter } from "next/navigation";
import { useId, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Form, FormError, FormSuccess } from "@/components/ui/form";
import { Field, Input, Textarea } from "@/components/ui/input";
import { api } from "@/lib/api/client";
import { applyServerError } from "@/lib/forms/server-errors";
import { profileSchema, type ProfileInput } from "@/lib/schemas/profile";
import type { CurrentUser } from "@/lib/types";

export function ProfileForm({ user }: { user: CurrentUser }) {
  const id = useId();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const form = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user.name, bio: user.bio ?? "" },
  });

  const onSubmit = form.handleSubmit((values) => {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      try {
        await api.put("/profile", { name: values.name, bio: values.bio || null });
        setMessage("Profile updated.");
        router.refresh();
      } catch (err) {
        setError(applyServerError(err, form.setError));
      }
    });
  });

  return (
    <Form label="Edit profile" onSubmit={onSubmit} pending={pending} className="max-w-lg">
      <Field label="Name" htmlFor={`${id}-name`} error={form.formState.errors.name?.message}>
        <Input id={`${id}-name`} disabled={pending} {...form.register("name")} />
      </Field>
      <Field label="Bio" htmlFor={`${id}-bio`} error={form.formState.errors.bio?.message}>
        <Textarea id={`${id}-bio`} maxLength={500} disabled={pending} {...form.register("bio")} />
      </Field>
      <p className="text-sm text-muted">
        Email: <span className="text-foreground">{user.email}</span>
      </p>
      <FormSuccess>{message}</FormSuccess>
      <FormError>{error}</FormError>
      <Button type="submit" loading={pending}>
        Save profile
      </Button>
    </Form>
  );
}
