import { dictionaryFor } from "@/lib/i18n/dictionary";
import { getLocale } from "@/lib/theme/locale";

export const metadata = { title: "Maintenance" };

export default async function MaintenancePage() {
  const copy = dictionaryFor(await getLocale());
  return (
    <main id="main" className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center px-4 text-center">
      <p className="animate-fade-up font-mono text-xs uppercase tracking-[0.28em] text-accent">503</p>
      <h1 className="mt-3 font-display text-3xl font-semibold">{copy.errors.maintenance}</h1>
      <p className="mt-3 text-muted">{copy.errors.maintenanceBody}</p>
    </main>
  );
}
