"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Menu, Search, Shield, Zap } from "lucide-react";
import { useCommandPalette } from "@/components/command-palette";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { NotificationsCenter } from "@/components/notifications-center";
import { Logo } from "@/components/logo";
import { SoundToggle } from "@/components/sound-toggle";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { Button, buttonVariants } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { Sheet } from "@/components/ui/sheet";
import { api } from "@/lib/api/client";
import { useDictionary, useLocale } from "@/lib/i18n";
import { useScrolled } from "@/lib/motion/use-scrolled";
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
  const scrolled = useScrolled();

  async function logout() {
    try {
      await api.post("/auth/logout");
    } finally {
      router.push("/");
      router.refresh();
    }
  }

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b transition-[background-color,border-color,box-shadow,backdrop-filter] duration-300",
        scrolled
          ? "border-border bg-background/85 shadow-sm backdrop-blur-xl"
          : "border-transparent bg-background/55 backdrop-blur-sm",
      )}
    >
      <div
        className={cn(
          "mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 transition-[height] duration-300",
          scrolled ? "h-14" : "h-16",
        )}
      >
        <Link
          href="/"
          aria-label="Catch The Flag home"
          className="shrink-0 rounded-md transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
        >
          <Logo />
        </Link>

        <nav className="hidden items-center gap-6 md:flex" aria-label="Main">
          {NAV.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                data-active={active}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "nav-underline py-1 text-sm transition-colors",
                  active ? "text-foreground" : "text-muted hover:text-foreground",
                )}
              >
                {copy.nav[item.key]}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <button
            type="button"
            onClick={() => command.setOpen(true)}
            className="group inline-flex h-8 items-center gap-2 rounded-lg border border-border bg-surface-raised/60 px-2.5 text-xs text-muted transition-colors hover:border-accent/40 hover:bg-surface-raised hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
          >
            <Search aria-hidden="true" className="size-3.5 text-faint group-hover:text-accent" />
            <span className="hidden lg:inline">{copy.search}</span>
            <span className="ms-1 flex items-center gap-1">
              <Kbd>Ctrl</Kbd>
              <Kbd>K</Kbd>
            </span>
          </button>
          <LocaleSwitcher locale={locale} />
          <ThemeSwitcher initial={theme} signedIn={!!user} />
          <SoundToggle />
          {user ? (
            <>
              <Link
                href="/dashboard"
                className={cn(
                  "text-sm font-medium transition-colors",
                  isActive("/dashboard") ? "text-foreground" : "text-muted hover:text-foreground",
                )}
              >
                {copy.nav.dashboard}
              </Link>
              <span
                title={`${formatXp(user.xp)} XP`}
                className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-2.5 py-1 font-mono text-xs text-accent"
              >
                <Zap aria-hidden="true" className="size-3" />
                {formatXp(user.xp)} XP
              </span>
              <NotificationsCenter />
              {user.role !== "user" ? (
                <Link
                  href="/admin"
                  className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 font-mono text-[11px] uppercase text-muted transition-colors hover:border-accent/40 hover:text-foreground"
                >
                  <Shield aria-hidden="true" className="size-3" />
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
          className="rounded-md border border-border p-2 text-muted transition-colors hover:bg-surface-raised hover:text-foreground md:hidden"
          aria-expanded={open}
          aria-label={open ? copy.close : copy.nav.menu}
          onClick={() => setOpen((value) => !value)}
        >
          <Menu aria-hidden="true" className="size-[18px]" />
        </button>
      </div>

      <Sheet open={open} onClose={() => setOpen(false)} title={copy.nav.menu}>
        <div className="flex min-h-full flex-col gap-6">
          <nav className="flex flex-col gap-1" aria-label="Mobile">
            <p className="px-1 pb-1 font-mono text-[10px] uppercase tracking-[0.18em] text-faint">
              {copy.nav.menu}
            </p>
            {NAV.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center justify-between rounded-lg px-3 py-2.5 text-sm transition-colors",
                    active
                      ? "bg-accent/10 text-accent"
                      : "text-muted hover:bg-surface-raised hover:text-foreground",
                  )}
                >
                  {copy.nav[item.key]}
                  <span aria-hidden="true" className="text-faint">
                    /
                  </span>
                </Link>
              );
            })}
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center justify-between rounded-lg px-3 py-2.5 text-sm transition-colors",
                    isActive("/dashboard")
                      ? "bg-accent/10 text-accent"
                      : "text-muted hover:bg-surface-raised hover:text-foreground",
                  )}
                >
                  {copy.nav.dashboard}
                  <span className="font-mono text-xs text-accent">{formatXp(user.xp)} XP</span>
                </Link>
                {user.role !== "user" ? (
                  <Link
                    href="/admin"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-muted transition-colors hover:bg-surface-raised hover:text-foreground"
                  >
                    <Shield aria-hidden="true" className="size-3.5" />
                    {copy.nav.admin}
                  </Link>
                ) : null}
              </>
            ) : null}
          </nav>

          <div className="space-y-3">
            <p className="px-1 font-mono text-[10px] uppercase tracking-[0.18em] text-faint">
              Preferences
            </p>
            <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-surface-raised/50 p-2">
              <LocaleSwitcher locale={locale} />
              <ThemeSwitcher initial={theme} signedIn={!!user} />
              <SoundToggle />
            </div>
          </div>

          <div className="mt-auto space-y-2 border-t border-border pt-4">
            {user ? (
              <Button variant="ghost" size="sm" className="w-full justify-start" onClick={logout}>
                {copy.nav.logout}
              </Button>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className={cn(buttonVariants("outline", "md"), "w-full")}
                >
                  {copy.nav.login}
                </Link>
                <Link
                  href="/register"
                  onClick={() => setOpen(false)}
                  className={cn(buttonVariants("primary", "md"), "w-full")}
                >
                  {copy.nav.start}
                </Link>
              </>
            )}
          </div>
        </div>
      </Sheet>
    </header>
  );
}
