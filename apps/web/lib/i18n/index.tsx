"use client";

import { createContext, useContext } from "react";
import { dictionaryFor } from "@/lib/i18n/dictionary";
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
      <LocaleContext.Provider value={dictionaryFor(locale)}>{children}</LocaleContext.Provider>
    </LocaleCodeContext.Provider>
  );
}

export function useDictionary(): Dictionary {
  return useContext(LocaleContext);
}

export function useLocale(): Locale {
  return useContext(LocaleCodeContext);
}

export { dictionaryFor };
