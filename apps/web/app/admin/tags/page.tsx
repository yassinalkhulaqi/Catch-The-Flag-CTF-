import { ErrorState, PageHeader } from "@/components/empty-state";
import { TagCreateForm, TagList } from "@/components/admin/tag-forms";
import { requireStaff } from "@/lib/auth";
import { serverApi } from "@/lib/api/server";
import type { Tag } from "@/lib/types";

export const metadata = { title: "Admin · Tags" };

export default async function AdminTagsPage() {
  await requireStaff();
  let tags: Tag[] = [];
  try {
    try {
      const res = await serverApi<{ data: Tag[] }>("GET", "/admin/tags");
      tags = Array.isArray(res.data) ? res.data : [];
    } catch {
      const res = await serverApi<{ data: Tag[] }>("GET", "/tags");
      tags = res.data;
    }
  } catch {
    return <ErrorState />;
  }

  return (
    <div>
      <PageHeader eyebrow="Taxonomy" title="Tags" description="Cross-cutting challenge labels." />
      <TagCreateForm />
      <TagList tags={tags} />
    </div>
  );
}
