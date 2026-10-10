import { ar } from "@/lib/i18n/ar";
import { en, type Dictionary } from "@/lib/i18n/en";
import type { Locale } from "@/lib/theme/locale";

export function dictionaryFor(locale: Locale): Dictionary {
  return locale === "ar" ? ar : en;
}
