import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { PaginationMeta } from "@/lib/types";

export function Pagination({
  meta,
  hrefForPage,
}: {
  meta: PaginationMeta;
  hrefForPage: (page: number) => string;
}) {
  if (meta.last_page <= 1) return null;
  const pages = pageWindow(meta.current_page, meta.last_page);
  return (
    <nav aria-label="Pagination" className="mt-6 flex flex-wrap items-center gap-2">
      <PageLink
        href={hrefForPage(Math.max(1, meta.current_page - 1))}
        disabled={meta.current_page <= 1}
      >
        Previous
      </PageLink>
      {pages.map((page, index) =>
        page === "gap" ? (
          <span key={`gap-${index}`} className="px-1 text-faint" aria-hidden="true">
            …
          </span>
        ) : (
          <Link
            key={page}
            href={hrefForPage(page)}
            aria-current={page === meta.current_page ? "page" : undefined}
            className={cn(
              buttonVariants(page === meta.current_page ? "primary" : "outline", "sm"),
              "min-w-9",
            )}
          >
            {page}
          </Link>
        ),
      )}
      <PageLink
        href={hrefForPage(Math.min(meta.last_page, meta.current_page + 1))}
        disabled={meta.current_page >= meta.last_page}
      >
        Next
      </PageLink>
    </nav>
  );
}

function PageLink({
  href,
  disabled,
  children,
}: {
  href: string;
  disabled: boolean;
  children: React.ReactNode;
}) {
  if (disabled) {
    return (
      <span className={cn(buttonVariants("outline", "sm"), "pointer-events-none opacity-40")}>{children}</span>
    );
  }
  return (
    <Link href={href} className={buttonVariants("outline", "sm")}>
      {children}
    </Link>
  );
}

function pageWindow(current: number, last: number): Array<number | "gap"> {
  const pages = new Set<number>([1, last, current - 1, current, current + 1]);
  const sorted = [...pages].filter((page) => page >= 1 && page <= last).sort((a, b) => a - b);
  const result: Array<number | "gap"> = [];
  for (let index = 0; index < sorted.length; index += 1) {
    const page = sorted[index];
    const previous = sorted[index - 1];
    if (previous !== undefined && page - previous > 1) result.push("gap");
    result.push(page);
  }
  return result;
}
