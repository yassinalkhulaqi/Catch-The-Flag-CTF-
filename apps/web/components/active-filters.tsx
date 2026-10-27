import Link from "next/link";
import { X } from "lucide-react";

export interface ActiveFilter {
  key: string;
  label: string;
  href: string;
}

export function ActiveFilters({
  filters,
  clearHref,
}: {
  filters: ActiveFilter[];
  clearHref: string;
}) {
  if (filters.length === 0) return null;

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2" aria-label="Active filters">
      {filters.map((filter) => (
        <Link
          key={filter.key}
          href={filter.href}
          className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-2.5 py-1 text-xs text-accent transition-colors hover:bg-accent/20"
        >
          {filter.label}
          <X aria-hidden="true" className="size-3" />
          <span className="sr-only">Remove filter</span>
        </Link>
      ))}
      <Link
        href={clearHref}
        className="text-xs text-muted underline-offset-4 transition-colors hover:text-foreground hover:underline"
      >
        Clear all
      </Link>
    </div>
  );
}
