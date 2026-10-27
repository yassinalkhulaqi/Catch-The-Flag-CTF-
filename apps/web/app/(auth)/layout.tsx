import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2, Crosshair, ShieldCheck, Terminal } from "lucide-react";
import { Logo } from "@/components/logo";
import { getCurrentUser } from "@/lib/api/server";

const FEATURES = [
  "Theory-to-practice paths with server-verified progress",
  "Static, downloadable CTF challenges",
  "Deterministic leaderboard and XP ledger",
];

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return (
    <main id="main" className="grid flex-1 lg:grid-cols-[1.05fr_1fr]">
      <section
        className="relative hidden overflow-hidden border-r border-border bg-surface/40 lg:block"
        aria-hidden="true"
      >
        <div className="dot-grid pointer-events-none absolute inset-0 opacity-40" />
        <div className="aurora pointer-events-none absolute inset-0 opacity-70" />
        <div className="relative flex h-full flex-col justify-between gap-12 p-10 xl:p-14">
          <Logo />

          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-accent">
              <ShieldCheck className="size-3" />
              Server-scored learning
            </span>
            <p className="mt-5 max-w-md font-display text-4xl font-semibold leading-tight xl:text-5xl">
              A quiet place to get better at the work.
            </p>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted">
              Paths, file-based challenges, and a leaderboard that only moves when the
              server records a solve.
            </p>
            <ul className="mt-8 space-y-3">
              {FEATURES.map((feature) => (
                <li key={feature} className="flex items-start gap-2.5 text-sm text-muted">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-faint">
            <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wide">
              <Crosshair className="size-3" />
              No live targets
            </span>
            <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wide">
              <Terminal className="size-3" />
              Flags stay on the server
            </span>
          </div>
        </div>
      </section>

      <section className="atmosphere relative flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <Link
            href="/"
            className="mb-8 flex justify-center lg:hidden"
            aria-label="Catch The Flag home"
          >
            <Logo />
          </Link>
          <div className="rounded-2xl border border-border bg-surface/80 p-6 shadow-[var(--shadow-float)] backdrop-blur sm:p-8">
            {children}
          </div>
        </div>
      </section>
    </main>
  );
}
