"use client";

import { createContext, useContext } from "react";
import { ar } from "@/lib/i18n/ar";
import { en, type Dictionary } from "@/lib/i18n/en";
import type { Locale } from "@/lib/theme/locale";

const LocaleContext = createContext<Dictionary>(en);
const LocaleCodeContext = createContext<Locale>("en");

export function LocaleProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: React.ReactNode;
}) {
  return (
    <LocaleCodeContext.Provider value={locale}>
      <LocaleContext.Provider value={locale === "ar" ? ar : en}>{children}</LocaleContext.Provider>
    </LocaleCodeContext.Provider>
  );
}

export function useDictionary(): Dictionary {
  return useContext(LocaleContext);
}

export function useLocale(): Locale {
  return useContext(LocaleCodeContext);
}

export function dictionaryFor(locale: Locale): Dictionary {
  return locale === "ar" ? ar : en;
}
