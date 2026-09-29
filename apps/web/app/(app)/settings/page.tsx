import { PageHeader } from "@/components/empty-state";
import { PasswordForm } from "@/components/password-form";
import { requireUser } from "@/lib/auth";
import { serverApi } from "@/lib/api/server";
import type { UserSettings } from "@/lib/types";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  await requireUser();
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
        title="Settings"
        description="Manage credentials and preferences."
      />
      <section aria-labelledby="prefs-heading">
        <h2 id="prefs-heading" className="mb-3 font-mono text-xs uppercase tracking-[0.16em] text-accent">
          Preferences
        </h2>
        <dl className="max-w-lg space-y-2 text-sm">
          <div className="flex justify-between border-b border-border py-2">
            <dt className="text-muted">Email</dt>
            <dd className="text-foreground">{settings.email || "—"}</dd>
          </div>
          <div className="flex justify-between border-b border-border py-2">
            <dt className="text-muted">Theme</dt>
            <dd className="font-mono text-foreground">{settings.theme}</dd>
          </div>
        </dl>
        <p className="mt-3 text-xs text-faint">
          Theme preference is stored server-side; the UI remains dark-first in V1.
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
