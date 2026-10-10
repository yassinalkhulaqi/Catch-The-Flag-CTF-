"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { api } from "@/lib/api/client";
import type { ThemeName } from "@/lib/design/tokens";
import { THEME_COOKIE, applyDocumentTheme, writeClientCookie } from "@/lib/theme/boot";
import { cn } from "@/lib/utils";
import type { UserSettings } from "@/lib/types";

const OPTIONS: Array<{ value: ThemeName; label: string }> = [
  { value: "dark", label: "Dark" },
  { value: "light", label: "Light" },
  { value: "system", label: "System" },
];

/**
 * Applies the theme before paint of the next navigation.
 * Signed-in choice is stored by the API. Guests keep a cookie only.
 */
export function ThemeSwitcher({
  initial,
  signedIn,
}: {
  initial: ThemeName;
  signedIn: boolean;
}) {
  const router = useRouter();
  const [theme, setTheme] = useState<ThemeName>(initial);
  const [pending, startTransition] = useTransition();

  function apply(next: ThemeName) {
    setTheme(next);
    applyDocumentTheme(next);
    writeClientCookie(THEME_COOKIE, next);
    if (!signedIn) return;
    startTransition(async () => {
      try {
        const res = await api.put<{ data: UserSettings }>("/me/settings", { theme: next });
        applyDocumentTheme(res.data.theme);
        writeClientCookie(THEME_COOKIE, res.data.theme);
        setTheme(res.data.theme);
        router.refresh();
      } catch {
        /* The document already shows the choice; the next save can retry. */
      }
    });
  }

  return (
    <div role="radiogroup" aria-label="Theme" className="inline-flex rounded-md border border-border p-0.5">
      {OPTIONS.map((option) => {
        const selected = theme === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={pending}
            onClick={() => apply(option.value)}
            className={cn(
              "rounded px-2.5 py-1 text-xs",
              selected ? "bg-accent text-accent-foreground" : "text-muted hover:text-foreground",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
