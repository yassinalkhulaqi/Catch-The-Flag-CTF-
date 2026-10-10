import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { dictionaryFor } from "@/lib/i18n/dictionary";
import { getLocale } from "@/lib/theme/locale";
import { cn } from "@/lib/utils";

export default async function NotFound() {
  const copy = dictionaryFor(await getLocale());
  return (
    <main id="main" className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center px-4 py-16 text-center">
      <p className="animate-fade-up font-mono text-xs uppercase tracking-[0.28em] text-accent">404</p>
      <h1 className="animate-fade-up-delay mt-3 font-display text-3xl font-semibold tracking-tight">
        {copy.errors.notFound}
      </h1>
      <p className="mt-3 text-muted">{copy.errors.notFoundBody}</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/" className={cn(buttonVariants("primary", "md"))}>
          {copy.errors.home}
        </Link>
        <Link href="/challenges" className={cn(buttonVariants("outline", "md"))}>
          {copy.errors.browse}
        </Link>
      </div>
    </main>
  );
}
