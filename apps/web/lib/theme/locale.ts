import { cookies } from "next/headers";
import { LOCALE_COOKIE } from "@/lib/theme/boot";

export type Locale = "en" | "ar";

export function isLocale(value: string | undefined | null): value is Locale {
  return value === "en" || value === "ar";
}

export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  const value = store.get(LOCALE_COOKIE)?.value;
  return isLocale(value) ? value : "en";
}

export function directionFor(locale: Locale): "ltr" | "rtl" {
  return locale === "ar" ? "rtl" : "ltr";
}
