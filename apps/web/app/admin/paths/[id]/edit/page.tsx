import Link from "next/link";
import { notFound } from "next/navigation";
import { PathEditor } from "@/components/admin/path-forms";
import { ErrorState, PageHeader } from "@/components/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { ApiError } from "@/lib/api/client";
import { requireStaff } from "@/lib/auth";
import { serverApi } from "@/lib/api/server";
import { cn } from "@/lib/utils";
import type { Category, PathDetail } from "@/lib/types";

export const metadata = { title: "Admin · Edit path" };

export default async function AdminPathEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireStaff();
  const { id } = await params;

  let path: PathDetail | null = null;
  let categories: Category[] = [];
  try {
    const [pathRes, catRes] = await Promise.all([
      serverApi<{ data: PathDetail }>("GET", `/admin/paths/${id}`),
      serverApi<{ data: Category[] }>("GET", "/categories"),
    ]);
    path = pathRes.data;
    categories = catRes.data;
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    return <ErrorState title="Path unavailable" />;
  }

  if (!path) notFound();

  return (
    <div>
      <PageHeader
        eyebrow="Authoring"
        title={path.title}
        description="Edit basics and change publication status."
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/paths" className={cn(buttonVariants("ghost", "sm"))}>
              Back to list
            </Link>
            <Link
              href={`/paths/${path.slug}`}
              className={cn(buttonVariants("outline", "sm"))}
            >
              View public
            </Link>
          </div>
        }
      />
      <PathEditor path={path} categories={categories} />
    </div>
  );
}
