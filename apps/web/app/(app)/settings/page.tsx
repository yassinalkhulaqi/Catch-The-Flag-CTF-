import { PageHeader } from "@/components/empty-state";
import { PasswordForm } from "@/components/password-form";
import { ThemeSettingsForm } from "@/components/theme-settings-form";
import { requireUser } from "@/lib/auth";
import { dictionaryFor } from "@/lib/i18n/dictionary";
import { getLocale } from "@/lib/theme/locale";
import { serverApi } from "@/lib/api/server";
import type { UserSettings } from "@/lib/types";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  await requireUser();
  const copy = dictionaryFor(await getLocale());
  let settings: UserSettings = { email: "", theme: "system" };
  try {
    const res = await serverApi<{ data: UserSettings }>("GET", "/me/settings");
    settings = res.data;
  } catch {
    /* password form still usable */
  }

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
            <dd className="text-foreground">{settings.email || "—"}</dd>
          </div>
        </dl>
      </section>
      <section aria-labelledby="prefs-heading">
        <h2 id="prefs-heading" className="mb-3 font-mono text-xs uppercase tracking-[0.16em] text-accent">
          Preferences
        </h2>
        <ThemeSettingsForm initialTheme={settings.theme} />
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
