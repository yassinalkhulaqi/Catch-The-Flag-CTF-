import { PageHeader } from "@/components/empty-state";
import { PasswordForm } from "@/components/password-form";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { requireUser } from "@/lib/auth";
import { dictionaryFor } from "@/lib/i18n/dictionary";
import { getLocale } from "@/lib/theme/locale";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const user = await requireUser();
  const copy = dictionaryFor(await getLocale());

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Account"
        title={copy.pages.settingsTitle}
        description={copy.pages.settingsBody}
      />
      <section aria-labelledby="account-heading">
        <h2
          id="account-heading"
          className="mb-3 font-mono text-xs uppercase tracking-[0.16em] text-accent"
        >
          Account
        </h2>
        <dl className="max-w-lg space-y-2 text-sm">
          <div className="flex justify-between border-b border-border py-2">
            <dt className="text-muted">Email</dt>
            <dd className="text-foreground">{user.email}</dd>
          </div>
        </dl>
      </section>
      <section aria-labelledby="prefs-heading">
        <h2 id="prefs-heading" className="mb-3 font-mono text-xs uppercase tracking-[0.16em] text-accent">
          Preferences
        </h2>
        {/*
          V1 has no GET/PUT /me/settings endpoint (see routes/api.php), so the
          theme is stored in the ctf_theme cookie on this device only.
          signedIn={false} keeps ThemeSwitcher from calling a nonexistent API.
        */}
        <ThemeSwitcher initial={user.theme ?? "system"} signedIn={false} />
        <p className="mt-2 text-xs text-muted">
          Saved on this device only.
        </p>
      </section>
      <section aria-labelledby="password-heading">
        <h2
          id="password-heading"
          className="mb-3 font-mono text-xs uppercase tracking-[0.16em] text-accent"
        >
          Password
        </h2>
        <PasswordForm />
      </section>
    </div>
  );
}
