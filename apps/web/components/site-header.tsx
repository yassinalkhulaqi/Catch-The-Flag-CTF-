"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useCommandPalette } from "@/components/command-palette";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { Logo } from "@/components/logo";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { Button, buttonVariants } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { Sheet } from "@/components/ui/sheet";
import { api } from "@/lib/api/client";
import { useDictionary, useLocale } from "@/lib/i18n";
import { cn, formatXp } from "@/lib/utils";
import type { ThemeName } from "@/lib/design/tokens";
import type { CurrentUser } from "@/lib/types";

const NAV = [
  { href: "/challenges", key: "challenges" },
  { href: "/paths", key: "paths" },
  { href: "/leaderboard", key: "leaderboard" },
  { href: "/about", key: "about" },
] as const;

export function SiteHeader({ user }: { user: CurrentUser | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const command = useCommandPalette();
  const copy = useDictionary();
  const locale = useLocale();
  const theme = (user?.theme ?? "dark") as ThemeName;

  async function logout() {
    try {
      await api.post("/auth/logout");
    } finally {
      router.push("/");
      router.refresh();
    }
  }

  const linkClass = (href: string) =>
    cn(
      "text-sm text-muted transition-colors hover:text-foreground",
      (pathname === href || pathname.startsWith(`${href}/`)) && "text-foreground",
    );

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="/" aria-label="Catch The Flag home">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-6 md:flex" aria-label="Main">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className={linkClass(item.href)}>
              {copy.nav[item.key]}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <button
            type="button"
            onClick={() => command.setOpen(true)}
            className="inline-flex items-center gap-2 rounded-md border border-border px-2 py-1 text-xs text-muted hover:text-foreground"
          >
            {copy.search}
            <Kbd>Ctrl</Kbd>
            <Kbd>K</Kbd>
          </button>
          <LocaleSwitcher locale={locale} />
          <ThemeSwitcher initial={theme} signedIn={!!user} />
          {user ? (
            <>
              <Link href="/dashboard" className={cn(linkClass("/dashboard"), "font-medium")}>
                {copy.nav.dashboard}
              </Link>
              <span className="font-mono text-xs text-accent">{formatXp(user.xp)} XP</span>
              {user.role !== "user" ? (
                <Link
                  href="/admin"
                  className="rounded border border-border px-2 py-1 font-mono text-[11px] uppercase text-muted hover:text-foreground"
                >
                  {copy.nav.admin}
                </Link>
              ) : null}
              <Button variant="ghost" size="sm" onClick={logout}>
                {copy.nav.logout}
              </Button>
            </>
          ) : (
            <>
              <Link href="/login" className={cn(buttonVariants("ghost", "sm"))}>
                {copy.nav.login}
              </Link>
              <Link href="/register" className={cn(buttonVariants("primary", "sm"))}>
                {copy.nav.start}
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          className="rounded-md border border-border p-2 text-muted md:hidden"
          aria-expanded={open}
          aria-label={open ? copy.close : copy.nav.menu}
          onClick={() => setOpen((value) => !value)}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <Sheet open={open} onClose={() => setOpen(false)} title={copy.nav.menu}>
        <nav className="flex flex-col gap-3" aria-label="Mobile">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className={linkClass(item.href)} onClick={() => setOpen(false)}>
              {copy.nav[item.key]}
            </Link>
          ))}
          <LocaleSwitcher locale={locale} />
          <ThemeSwitcher initial={theme} signedIn={!!user} />
          {user ? (
            <>
              <Link href="/dashboard" onClick={() => setOpen(false)} className={linkClass("/dashboard")}>
                {copy.nav.dashboard}
              </Link>
              {user.role !== "user" ? (
                <Link href="/admin" onClick={() => setOpen(false)} className={linkClass("/admin")}>
                  {copy.nav.admin}
                </Link>
              ) : null}
              <Button variant="ghost" size="sm" className="justify-start" onClick={logout}>
                {copy.nav.logout}
              </Button>
            </>
          ) : (
            <>
              <Link href="/login" onClick={() => setOpen(false)} className={linkClass("/login")}>
                {copy.nav.login}
              </Link>
              <Link href="/register" onClick={() => setOpen(false)} className={linkClass("/register")}>
                {copy.nav.start}
              </Link>
            </>
          )}
        </nav>
      </Sheet>
    </header>
  );
}
