import { Pagination } from "@/components/ui/pagination";
import type { PaginationMeta } from "@/lib/types";

export function PaginationNav({
  meta,
  hrefForPage,
}: {
  meta: PaginationMeta;
  hrefForPage: (page: number) => string;
}) {
  if (meta.last_page <= 1) return null;
  return (
    <div className="space-y-2">
      <p className="font-mono text-xs text-faint">
        Page {meta.current_page} of {meta.last_page}
      </p>
      <Pagination meta={meta} hrefForPage={hrefForPage} />
    </div>
  );
}
