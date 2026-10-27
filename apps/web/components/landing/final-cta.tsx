import Link from "next/link";
import { ArrowUpRight, Terminal } from "lucide-react";

export function FinalCTA({ signedIn }: { signedIn: boolean }) {
  return (
    <section className="relative overflow-hidden border-t border-border">
      <div aria-hidden="true" className="hero-grid absolute inset-0 opacity-50" />
      <div aria-hidden="true" className="aurora pointer-events-none absolute inset-0" />
      <div className="relative mx-auto max-w-6xl px-4 py-20">
        <div className="rounded-3xl border border-border bg-surface/80 p-8 shadow-[var(--shadow-float)] backdrop-blur sm:p-12 lg:flex lg:items-center lg:justify-between lg:gap-10">
          <div className="max-w-xl">
            <p className="type-eyebrow text-accent">// Next move</p>
            <h2 className="type-title mt-3 text-balance">
              Start with a path, or go straight to a challenge.
            </h2>
            <p className="mt-3 text-muted">
              Files stay attachments. Flags stay on the server. Your rank moves only when a solve
              is recorded.
            </p>
          </div>
          <div className="mt-7 flex flex-wrap gap-3 lg:mt-0 lg:shrink-0">
            <Link
              href={signedIn ? "/dashboard" : "/register"}
              className="hover-arrow inline-flex h-11 items-center gap-2 rounded-md bg-accent px-6 text-sm font-medium text-accent-foreground shadow-sm transition-colors hover:bg-accent-hover"
            >
              {signedIn ? "Open dashboard" : "Create an account"}
              <ArrowUpRight aria-hidden="true" className="hover-arrow-icon size-4" />
            </Link>
            <Link
              href="/challenges"
              className="inline-flex h-11 items-center gap-2 rounded-md border border-border-strong px-6 text-sm text-foreground transition-colors hover:bg-surface-raised"
            >
              <Terminal aria-hidden="true" className="size-4" />
              Browse challenges
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
