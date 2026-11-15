import { notFound } from "next/navigation";
import Link from "next/link";
import { ModuleLessons } from "@/components/admin/lesson-authoring";
import { ErrorState, PageHeader } from "@/components/empty-state";
import { ApiError } from "@/lib/api/client";
import { serverApi } from "@/lib/api/server";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import type { AdminModule } from "@/lib/types";

export const metadata = { title: "Admin · Module lessons" };

/** Author one module's lessons, their quizzes and their linked challenges. */
export default async function AdminModulePage({
  params,
}: {
  params: Promise<{ moduleId: string }>;
}) {
  const { moduleId } = await params;

  let moduleData: AdminModule | null = null;
  try {
    const res = await serverApi<{ data: AdminModule }>("GET", `/admin/modules/${moduleId}`);
    moduleData = res.data;
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    return <ErrorState title="Module unavailable" />;
  }

  if (!moduleData) notFound();

  return (
    <div>
      <PageHeader
        eyebrow="Curriculum"
        title={moduleData.title}
        description="Edit lessons, their quiz and their linked challenges. Drafts are invisible to learners until published."
        actions={
          <Link href="/admin/paths" className={cn(buttonVariants("ghost", "sm"))}>
            ← Paths
          </Link>
        }
      />
      <div className="mt-6">
        <ModuleLessons moduleId={moduleData.id} initialLessons={moduleData.lessons ?? []} />
      </div>
    </div>
  );
}
