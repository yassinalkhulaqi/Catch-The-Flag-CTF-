"use client";

import { useId, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/input";
import { api, ApiError } from "@/lib/api/client";
import { errorMessage } from "@/lib/errors";
import type { UserSettings } from "@/lib/types";

const THEMES: Array<UserSettings["theme"]> = ["system", "light", "dark"];

export function ThemeSettingsForm({ initialTheme }: { initialTheme: UserSettings["theme"] }) {
  const id = useId();
  const [theme, setTheme] = useState(initialTheme);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    startTransition(async () => {
      try {
        const res = await api.put<{ data: UserSettings }>("/me/settings", { theme });
        setTheme(res.data.theme);
        setMessage("Preferences saved.");
      } catch (err) {
        setError(
          err instanceof ApiError
            ? errorMessage(err, "Could not save preferences.")
            : "Could not save preferences.",
        );
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="max-w-lg space-y-4">
      <Field label="Theme" htmlFor={`${id}-theme`} error={error ?? undefined}>
        <select
          id={`${id}-theme`}
          name="theme"
          value={theme}
          onChange={(e) => setTheme(e.target.value as UserSettings["theme"])}
          disabled={pending}
          className="w-full border border-border bg-surface px-3 py-2 text-sm text-foreground"
        >
          {THEMES.map((t) => (
            <option key={t} value={t}>
              {t === "system" ? "System" : t === "light" ? "Light" : "Dark"}
            </option>
          ))}
        </select>
      </Field>
      <p className="text-xs text-muted">
        Preference is stored on your account. The UI remains dark-first in V1; light theme is reserved for a future polish pass.
      </p>
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save preferences"}
      </Button>
      {message ? (
        <p className="text-sm text-success" role="status">
          {message}
        </p>
      ) : null}
    </form>
  );
}
