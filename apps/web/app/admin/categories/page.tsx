import { ErrorState, PageHeader } from "@/components/empty-state";
import { CategoryCreateForm, CategoryList } from "@/components/admin/category-forms";
import { requireStaff } from "@/lib/auth";
import { serverApi } from "@/lib/api/server";
import type { Category } from "@/lib/types";

export const metadata = { title: "Admin · Categories" };

export default async function AdminCategoriesPage() {
  await requireStaff();
  let categories: Category[] = [];
  try {
    // Admin resource may return paginated; fall back to public list.
    try {
      const res = await serverApi<{ data: Category[] }>("GET", "/admin/categories");
      categories = Array.isArray(res.data) ? res.data : [];
    } catch {
      const res = await serverApi<{ data: Category[] }>("GET", "/categories");
      categories = res.data;
    }
  } catch {
    return <ErrorState />;
  }

  return (
    <div>
      <PageHeader
        eyebrow="Taxonomy"
        title="Categories"
        description="Discipline labels for challenges and paths."
      />
      <CategoryCreateForm />
      <CategoryList categories={categories} />
    </div>
  );
}
