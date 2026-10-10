import type { Metadata } from "next";
import { Fraunces, IBM_Plex_Mono, IBM_Plex_Sans_Arabic, Source_Sans_3 } from "next/font/google";
import { cookies } from "next/headers";
import { Providers } from "@/components/providers";
import { getCurrentUser } from "@/lib/api/server";
import type { ThemeName } from "@/lib/design/tokens";
import { THEME_BOOT_SCRIPT, THEME_COOKIE } from "@/lib/theme/boot";
import { directionFor, getLocale } from "@/lib/theme/locale";
import "./globals.css";

const display = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  axes: ["SOFT", "WONK", "opsz"],
  display: "swap",
});

const body = Source_Sans_3({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const mono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const arabic = IBM_Plex_Sans_Arabic({
  variable: "--font-arabic",
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const siteDescription =
  "Cybersecurity learning paths and static CTF challenges — DFIR, malware analysis, reverse engineering, crypto, OSINT and more.";

export const metadata: Metadata = {
  title: {
    default: "Catch The Flag",
    template: "%s · Catch The Flag",
  },
  description: siteDescription,
  applicationName: "Catch The Flag",
  openGraph: {
    type: "website",
    siteName: "Catch The Flag",
    title: "Catch The Flag",
    description: siteDescription,
  },
  twitter: {
    card: "summary_large_image",
    title: "Catch The Flag",
    description: siteDescription,
  },
};

function isThemeName(value: string | undefined): value is ThemeName {
  return value === "dark" || value === "light" || value === "system";
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [user, locale, cookieStore] = await Promise.all([getCurrentUser(), getLocale(), cookies()]);
  const cookieTheme = cookieStore.get(THEME_COOKIE)?.value;
  const theme = user?.theme ?? (isThemeName(cookieTheme) ? cookieTheme : "dark");

  return (
    <html
      lang={locale}
      dir={directionFor(locale)}
      data-theme={theme}
      suppressHydrationWarning
      className={`${display.variable} ${body.variable} ${mono.variable} ${arabic.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
