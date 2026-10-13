import Link from "next/link";
import { PathCreateForm } from "@/components/admin/path-forms";
import { DifficultyBadge } from "@/components/difficulty-badge";
import { EmptyState, ErrorState, PageHeader } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { requireStaff } from "@/lib/auth";
import { serverApi } from "@/lib/api/server";
import { cn } from "@/lib/utils";
import type {
  Category,
  ContentStatus,
  Difficulty,
  Paginated,
} from "@/lib/types";

export const metadata = { title: "Admin · Paths" };

/**
 * OUR admin path shape (`AdminPathResource`): scalar fields plus workflow
 * status. It carries no nested category object and no module/lesson counts,
 * so the list below renders only fields the endpoint returns (slug +
 * summary) instead of fabricating counts.
 */
interface AdminPathRow {
  id: number;
  title: string;
  slug: string;
  summary: string;
  difficulty: Difficulty;
  status: ContentStatus;
}

function unwrapCategories(payload: unknown): Category[] {
  if (Array.isArray(payload)) return payload as Category[];
  if (payload !== null && typeof payload === "object") {
    const data = (payload as { data?: unknown }).data;
    if (Array.isArray(data)) return data as Category[];
  }
  return [];
}

export default async function AdminPathsPage() {
  await requireStaff();
  let items: AdminPathRow[] = [];
  let categories: Category[] = [];
  let loadError = false;
  try {
    const [pathRes, catRes] = await Promise.all([
      serverApi<Paginated<AdminPathRow>>("GET", "/admin/paths?per_page=50"),
      serverApi<{ data: Category[] } | Category[]>("GET", "/categories"),
    ]);
    items = pathRes.data;
    categories = unwrapCategories(catRes);
  } catch {
    loadError = true;
  }

  return (
    <div>
      <PageHeader
        eyebrow="Authoring"
        title="Paths"
        description="Learning path drafts and published curricula."
      />

      {!loadError ? <PathCreateForm categories={categories} /> : null}

      {loadError ? (
        <ErrorState />
      ) : items.length === 0 ? (
        <EmptyState className="mt-8" title="No paths yet" />
      ) : (
        <ul className="mt-8 divide-y divide-border border-t border-border">
          {items.map((p) => (
            <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
              <div className="max-w-2xl space-y-1">
                <Link
                  href={`/admin/paths/${p.id}/edit`}
                  className="font-semibold hover:text-accent"
                >
                  {p.title}
                </Link>
                <div className="flex flex-wrap items-center gap-2">
                  <DifficultyBadge difficulty={p.difficulty} />
                  <Badge>{p.status}</Badge>
                  <span className="font-mono text-xs text-faint">
                    {p.slug}
                  </span>
                </div>
                {p.summary ? (
                  <p className="text-sm text-muted">{p.summary}</p>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/admin/paths/${p.id}/edit`}
                  className={cn(buttonVariants("outline", "sm"))}
                >
                  Edit
                </Link>
                <Link
                  href={`/paths/${p.slug}`}
                  className="text-sm text-accent hover:underline"
                >
                  View public
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
