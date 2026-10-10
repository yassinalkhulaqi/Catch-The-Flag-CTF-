"use client";

import { CommandProvider } from "@/components/command-palette";
import { ToastProvider } from "@/components/ui/toast";
import { LocaleProvider, useDictionary } from "@/lib/i18n";
import type { Locale } from "@/lib/theme/locale";

export function Providers({
  locale,
  children,
}: {
  locale: Locale;
  children: React.ReactNode;
}) {
  return (
    <LocaleProvider locale={locale}>
      <ToastProvider>
        <CommandProvider>
          <SkipLink />
          {children}
        </CommandProvider>
      </ToastProvider>
    </LocaleProvider>
  );
}

function SkipLink() {
  const copy = useDictionary();
  return (
    <a
      href="#main"
      className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-[90] focus:rounded-md focus:bg-accent focus:px-3 focus:py-2 focus:text-accent-foreground"
    >
      {copy.skip}
    </a>
  );
}
