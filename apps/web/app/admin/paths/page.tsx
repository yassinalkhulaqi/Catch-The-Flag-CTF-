import { PathCreateForm } from "@/components/admin/path-forms";
import { PathTable } from "@/components/admin/path-table";
import { ErrorState, PageHeader } from "@/components/empty-state";
import { requireStaff } from "@/lib/auth";
import { serverApi } from "@/lib/api/server";
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
      ) : (
        <div className="mt-8">
          <PathTable rows={items} />
        </div>
      )}
    </div>
  );
}
