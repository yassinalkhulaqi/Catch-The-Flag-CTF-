import Link from "next/link";
import { redirect } from "next/navigation";
import { Logo } from "@/components/logo";
import { getCurrentUser } from "@/lib/api/server";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return (
    <main id="main" className="grid flex-1 lg:grid-cols-2">
      <section className="atmosphere relative hidden flex-col justify-between p-10 lg:flex" aria-hidden="true">
        <Logo />
        <div>
          <p className="type-eyebrow text-accent">Learn. Hunt. Capture.</p>
          <p className="mt-4 max-w-md font-display text-4xl font-semibold leading-tight">
            A quiet place to get better at the work.
          </p>
          <p className="mt-4 max-w-sm text-sm text-muted">
            Paths, file-based challenges, and a leaderboard that only moves when the server records a solve.
          </p>
        </div>
        <p className="font-mono text-xs text-faint">Flags stay on the server.</p>
      </section>
      <section className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <Link href="/" className="mb-8 flex justify-center lg:hidden" aria-label="Catch The Flag home">
            <Logo />
          </Link>
          {children}
        </div>
      </section>
    </main>
  );
}
