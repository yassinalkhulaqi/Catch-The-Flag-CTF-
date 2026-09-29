import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { PaginationMeta } from "@/lib/types";

export function PaginationNav({
  meta,
  hrefForPage,
}: {
  meta: PaginationMeta;
  hrefForPage: (page: number) => string;
}) {
  if (meta.last_page <= 1) return null;

  const prev = meta.current_page > 1 ? meta.current_page - 1 : null;
  const next = meta.current_page < meta.last_page ? meta.current_page + 1 : null;

  return (
    <nav
      className="mt-6 flex flex-wrap items-center justify-between gap-3"
      aria-label="Pagination"
    >
      <p className="font-mono text-xs text-faint">
        Page {meta.current_page} of {meta.last_page}
      </p>
      <div className="flex gap-2">
        {prev ? (
          <Link href={hrefForPage(prev)} className={cn(buttonVariants("outline", "sm"))}>
            Previous
          </Link>
        ) : (
          <span className={cn(buttonVariants("outline", "sm"), "pointer-events-none opacity-40")}>
            Previous
          </span>
        )}
        {next ? (
          <Link href={hrefForPage(next)} className={cn(buttonVariants("outline", "sm"))}>
            Next
          </Link>
        ) : (
          <span className={cn(buttonVariants("outline", "sm"), "pointer-events-none opacity-40")}>
            Next
          </span>
        )}
      </div>
    </nav>
  );
}
