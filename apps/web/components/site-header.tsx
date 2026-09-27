"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Logo } from "@/components/logo";
import { Button, buttonVariants } from "@/components/ui/button";
import { api } from "@/lib/api/client";
import { cn, formatXp } from "@/lib/utils";
import type { CurrentUser } from "@/lib/types";

const NAV = [
  { href: "/challenges", label: "Challenges" },
  { href: "/paths", label: "Paths" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/about", label: "About" },
];

export function SiteHeader({ user }: { user: CurrentUser | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

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
      pathname === href || pathname.startsWith(`${href}/`)
        ? "text-foreground"
        : "",
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
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <>
              <Link
                href="/dashboard"
                className={cn(linkClass("/dashboard"), "font-medium")}
              >
                Dashboard
              </Link>
              <span className="font-mono text-xs text-accent">
                {formatXp(user.xp)} XP
              </span>
              {user.role !== "user" ? (
                <Link
                  href="/admin"
                  className="rounded border border-border px-2 py-1 font-mono text-[11px] uppercase text-muted hover:text-foreground"
                >
                  Admin
                </Link>
              ) : null}
              <Button variant="ghost" size="sm" onClick={logout}>
                Log out
              </Button>
            </>
          ) : (
            <>
              <Link href="/login" className={cn(buttonVariants("ghost", "sm"))}>
                Log in
              </Link>
              <Link href="/register" className={cn(buttonVariants("primary", "sm"))}>
                Get started
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          className="rounded-md border border-border p-2 text-muted md:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {open ? (
        <div id="mobile-nav" className="border-t border-border px-4 py-3 md:hidden">
          <nav className="flex flex-col gap-3" aria-label="Mobile">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={linkClass(item.href)}
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <hr className="border-border" />
            {user ? (
              <>
                <Link href="/dashboard" onClick={() => setOpen(false)} className={linkClass("/dashboard")}>
                  Dashboard
                </Link>
                <Button variant="ghost" size="sm" className="justify-start" onClick={logout}>
                  Log out
                </Button>
              </>
            ) : (
              <>
                <Link href="/login" onClick={() => setOpen(false)} className={linkClass("/login")}>
                  Log in
                </Link>
                <Link href="/register" onClick={() => setOpen(false)} className={linkClass("/register")}>
                  Get started
                </Link>
              </>
            )}
          </nav>
        </div>
      ) : null}
    </header>
  );
}
