"use client";

import { useRouter } from "next/navigation";
import { useDictionary } from "@/lib/i18n";
import { LOCALE_COOKIE, applyDocumentLocale, writeClientCookie } from "@/lib/theme/boot";
import type { Locale } from "@/lib/theme/locale";
import { cn } from "@/lib/utils";

export function LocaleSwitcher({ locale }: { locale: Locale }) {
  const router = useRouter();
  const copy = useDictionary();

  function choose(next: Locale) {
    writeClientCookie(LOCALE_COOKIE, next);
    applyDocumentLocale(next);
    router.refresh();
  }

  return (
    <div role="radiogroup" aria-label={copy.locale.label} className="inline-flex rounded-md border border-border p-0.5">
      {(["en", "ar"] as const).map((code) => (
        <button
          key={code}
          type="button"
          role="radio"
          aria-checked={locale === code}
          onClick={() => choose(code)}
          className={cn(
            "rounded px-2.5 py-1 text-xs",
            locale === code ? "bg-accent text-accent-foreground" : "text-muted hover:text-foreground",
          )}
        >
          {copy.locale[code]}
        </button>
      ))}
    </div>
  );
}
