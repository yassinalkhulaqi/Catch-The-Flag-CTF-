import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center px-4 py-16 text-center">
      <p className="font-mono text-xs uppercase tracking-[0.28em] text-accent">404</p>
      <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight">
        Page not found
      </h1>
      <p className="mt-3 text-muted">
        That path doesn&apos;t exist — or you don&apos;t have access to see it.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/" className={cn(buttonVariants("primary", "md"))}>
          Home
        </Link>
        <Link href="/challenges" className={cn(buttonVariants("outline", "md"))}>
          Browse challenges
        </Link>
      </div>
    </main>
  );
}
