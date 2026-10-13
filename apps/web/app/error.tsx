"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { useDictionary } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const copy = useDictionary();

  useEffect(() => {
    // Keep console noise for developers; never render stack to users.
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center px-4 py-16 text-center">
      <p className="font-mono text-xs uppercase tracking-[0.28em] text-danger">Error</p>
      <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight">{copy.errors.generic}</h1>
      <p className="mt-3 text-muted">{copy.errors.genericBody}</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button type="button" onClick={reset}>
          {copy.errors.retry}
        </Button>
        <Link href="/" className={cn(buttonVariants("outline", "md"))}>
          {copy.errors.home}
        </Link>
      </div>
    </main>
  );
}
