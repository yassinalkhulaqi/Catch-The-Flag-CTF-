import { AtSign, KeyRound, Palette, ShieldCheck, UserRound } from "lucide-react";
import { PasswordForm } from "@/components/password-form";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { SessionList } from "@/components/session-list";
import { Badge } from "@/components/ui/badge";
import { requireUser } from "@/lib/auth";
import { dictionaryFor } from "@/lib/i18n/dictionary";
import { getLocale } from "@/lib/theme/locale";
import { serverApi } from "@/lib/api/server";
import type { ActiveSession, SessionsResponse } from "@/lib/types";

export const metadata = { title: "Settings" };

const NAV = [
  { href: "#account-heading", label: "Account" },
  { href: "#prefs-heading", label: "Preferences" },
  { href: "#sessions-heading", label: "Sessions" },
  { href: "#password-heading", label: "Password" },
] as const;

export default async function SettingsPage() {
  const user = await requireUser();
  const copy = dictionaryFor(await getLocale());
  // Session list is best-effort: a failure must never take the page down.
  let sessions: ActiveSession[] | null = null;
  try {
    const result = await serverApi<{ data: SessionsResponse }>("GET", "/auth/sessions");
    sessions = result.data.sessions;
  } catch {
    sessions = null;
  }
  const initials = user.name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
  const memberSince = new Date(user.created_at).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-2xl border border-border bg-surface/60 p-6 sm:p-8">
        <div aria-hidden="true" className="aurora pointer-events-none absolute inset-0 opacity-60" />
        <div className="relative flex flex-wrap items-center gap-5">
          <span className="inline-flex size-14 items-center justify-center rounded-2xl border border-accent/30 bg-accent/10 font-display text-lg font-semibold text-accent">
            {initials || "?"}
          </span>
          <div>
            <p className="type-eyebrow text-accent">Account</p>
            <h1 className="type-title mt-1">{copy.pages.settingsTitle}</h1>
            <p className="mt-1 text-sm text-muted">{copy.pages.settingsBody}</p>
          </div>
          <div className="ms-auto flex flex-wrap gap-2">
            <Badge tone={user.role === "admin" ? "accent" : "neutral"} className="normal-case">
              <ShieldCheck aria-hidden="true" className="size-3" />
              {user.role}
            </Badge>
            <Badge tone="neutral" className="normal-case">
              Joined {memberSince}
            </Badge>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[200px_1fr]">
        <nav aria-label="Settings sections" className="lg:sticky lg:top-20 lg:self-start">
          <ol className="flex gap-1 overflow-x-auto lg:flex-col">
            {NAV.map((item, index) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  className="group flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm text-muted transition-colors hover:bg-surface hover:text-foreground"
                >
                  <span className="font-mono text-[10px] text-faint group-hover:text-accent">
                    0{index + 1}
                  </span>
                  {item.label}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="space-y-6">
          <section
            aria-labelledby="account-heading"
            className="rounded-2xl border border-border bg-surface p-5 sm:p-6"
          >
            <h2
              id="account-heading"
              className="scroll-mt-24 type-eyebrow inline-flex items-center gap-2 text-accent"
            >
              <UserRound aria-hidden="true" className="size-3.5" />
              Account
            </h2>
            <dl className="mt-4 divide-y divide-border text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0">
                <dt className="flex items-center gap-2 text-muted">
                  <UserRound aria-hidden="true" className="size-3.5 text-faint" />
                  Name
                </dt>
                <dd className="font-medium text-foreground">{user.name}</dd>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 py-3">
                <dt className="flex items-center gap-2 text-muted">
                  <AtSign aria-hidden="true" className="size-3.5 text-faint" />
                  Email
                </dt>
                <dd className="font-mono text-foreground">{user.email}</dd>
              </div>
            </dl>
          </section>

          <section
            aria-labelledby="prefs-heading"
            className="rounded-2xl border border-border bg-surface p-5 sm:p-6"
          >
            <h2
              id="prefs-heading"
              className="scroll-mt-24 type-eyebrow inline-flex items-center gap-2 text-accent"
            >
              <Palette aria-hidden="true" className="size-3.5" />
              Preferences
            </h2>
            {/*
              V1 has no GET/PUT /me/settings endpoint (see routes/api.php), so the
              theme is stored in the ctf_theme cookie on this device only.
              signedIn={false} keeps ThemeSwitcher from calling a nonexistent API.
            */}
            <div className="mt-4">
              <ThemeSwitcher initial={user.theme ?? "system"} signedIn={false} />
              <p className="mt-2 text-xs text-muted">Saved on this device only.</p>
            </div>
          </section>

          <section
            aria-labelledby="sessions-heading"
            className="rounded-2xl border border-border bg-surface p-5 sm:p-6"
          >
            <h2
              id="sessions-heading"
              className="scroll-mt-24 type-eyebrow inline-flex items-center gap-2 text-accent"
            >
              <ShieldCheck aria-hidden="true" className="size-3.5" />
              Sessions
            </h2>
            <div className="mt-4">
              {sessions === null ? (
                <p className="text-sm text-muted">Sessions are unavailable right now. Refresh the page to try again.</p>
              ) : (
                <SessionList initialSessions={sessions} />
              )}
              <p className="mt-3 text-xs text-muted">
                Sessions last until the browser closes or you revoke them. Token hashes never leave the server.
              </p>
            </div>
          </section>

          <section
            aria-labelledby="password-heading"
            className="rounded-2xl border border-border bg-surface p-5 sm:p-6"
          >
            <h2
              id="password-heading"
              className="scroll-mt-24 type-eyebrow inline-flex items-center gap-2 text-accent"
            >
              <KeyRound aria-hidden="true" className="size-3.5" />
              Password
            </h2>
            <div className="mt-4">
              <PasswordForm />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
