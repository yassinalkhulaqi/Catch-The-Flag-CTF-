import type { Metadata } from "next";
import Link from "next/link";
import { ChallengeTable } from "@/components/admin/challenge-table";
import { EmptyState, ErrorState, PageHeader } from "@/components/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { requireStaff } from "@/lib/auth";
import { serverApi } from "@/lib/api/server";
import { tierFor } from "@/lib/tracks";
import { cn } from "@/lib/utils";
import type {
  Category,
  ChallengeSummary,
  ContentStatus,
  Paginated,
  Tag,
} from "@/lib/types";

export const metadata: Metadata = { title: "Admin · Challenges" };

/**
 * OUR admin list shape (`AdminChallengeResource`): scalar fields plus tags,
 * but only a `category_id` — no nested category object. The table below
 * joins the taxonomy list server-side so every row carries a real category.
 */
interface AdminChallengeRow {
  id: number;
  title: string;
  slug: string;
  category_id: number | null;
  difficulty: ChallengeSummary["difficulty"];
  points: number;
  estimated_minutes: number;
  solve_count: number;
  status: ContentStatus;
  tags: Tag[];
}

const FILTERS: Array<{ value: string; label: string }> = [
  { value: "", label: "All" },
  { value: "draft", label: "Draft" },
  { value: "review", label: "Review" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
];

function isStatus(value: string | undefined): value is ContentStatus {
  return (
    value === "draft" ||
    value === "review" ||
    value === "published" ||
    value === "archived"
  );
}

function unwrapCategories(payload: unknown): Category[] {
  if (Array.isArray(payload)) return payload as Category[];
  if (payload !== null && typeof payload === "object") {
    const data = (payload as { data?: unknown }).data;
    if (Array.isArray(data)) return data as Category[];
  }
  return [];
}

/** Admin challenge table (premium table UX) with server-side status filter. */
export default async function AdminChallengesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireStaff();
  const params = await searchParams;
  const active = isStatus(params.status) ? params.status : "";

  let items: ChallengeSummary[] = [];
  let total = 0;
  let loadError = false;
  try {
    const qs = new URLSearchParams({ per_page: "50" });
    if (active) qs.set("status", active);
    const [chRes, catRes] = await Promise.all([
      serverApi<Paginated<AdminChallengeRow>>("GET", `/admin/challenges?${qs}`),
      serverApi<{ data: Category[] } | Category[]>("GET", "/categories"),
    ]);
    const byId = new Map(unwrapCategories(catRes).map((c) => [c.id, c]));
    items = chRes.data.map((row) => {
      const cat =
        row.category_id != null ? byId.get(row.category_id) : undefined;
      return {
        id: row.id,
        title: row.title,
        slug: row.slug,
        category: cat
          ? { id: cat.id, name: cat.name, slug: cat.slug, color: cat.color }
          : { id: 0, name: "Uncategorized", slug: "uncategorized", color: null },
        difficulty: row.difficulty,
        tier: tierFor(row.difficulty),
        points: row.points,
        estimated_minutes: row.estimated_minutes ?? 0,
        tags: row.tags ?? [],
        solved: false,
        solve_count: row.solve_count ?? 0,
        status: row.status,
      } satisfies ChallengeSummary;
    });
    total = chRes.meta?.total ?? items.length;
  } catch {
    loadError = true;
  }

  return (
    <div>
      <PageHeader
        eyebrow="Authoring"
        title="Challenges"
        description={`Create, edit, and publish static challenges.${total ? ` ${total} in view.` : ""}`}
        actions={
          <Link href="/admin/challenges/new" className={cn(buttonVariants("primary", "sm"))}>
            New challenge
          </Link>
        }
      />

      <div className="mb-6 flex flex-wrap gap-1.5" role="group" aria-label="Filter by status">
        {FILTERS.map((f) => {
          const selected = active === f.value;
          return (
            <Link
              key={f.label}
              href={f.value ? `/admin/challenges?status=${f.value}` : "/admin/challenges"}
              aria-current={selected ? "true" : undefined}
              className={cn(
                "rounded-md border px-3 py-1.5 text-sm",
                selected
                  ? "border-accent/40 bg-accent/10 text-accent"
                  : "border-border text-muted hover:text-foreground",
              )}
            >
              {f.label}
            </Link>
          );
        })}
      </div>

      {loadError ? (
        <ErrorState description="The challenge list could not be loaded. Retry from the admin navigation." />
      ) : items.length === 0 ? (
        <EmptyState
          title="No challenges yet"
          description="Create a draft, add a write-only flag, then publish."
          action={
            <Link href="/admin/challenges/new" className={cn(buttonVariants("primary", "sm"))}>
              New challenge
            </Link>
          }
        />
      ) : (
        <ChallengeTable rows={items} />
      )}
    </div>
  );
}
