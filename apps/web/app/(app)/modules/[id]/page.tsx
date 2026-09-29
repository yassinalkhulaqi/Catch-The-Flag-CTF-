import Link from "next/link";
import { notFound } from "next/navigation";
import { ErrorState, PageHeader } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { ApiError } from "@/lib/api/client";
import { requireUser } from "@/lib/auth";
import { serverApi } from "@/lib/api/server";
import type { ModuleDetail } from "@/lib/types";

export const metadata = { title: "Module" };

export default async function ModulePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { id } = await params;

  let mod: ModuleDetail | null = null;
  try {
    const res = await serverApi<{ data: ModuleDetail }>("GET", `/modules/${id}`);
    mod = res.data;
  } catch (err) {
    if (err instanceof ApiError && (err.status === 404 || err.status === 403)) notFound();
    return <ErrorState title="Module unavailable" />;
  }

  if (!mod) notFound();

  return (
    <div>
      <PageHeader
        eyebrow={`Module ${mod.position}`}
        title={mod.title}
        description={mod.description ?? undefined}
      />
      <ol className="divide-y divide-border border border-border">
        {mod.lessons.map((lesson) => (
          <li key={lesson.id} className="flex items-center justify-between gap-3 px-4 py-3">
            <div>
              <p className="font-mono text-[11px] text-faint">Lesson {lesson.position}</p>
              <Link
                href={`/lessons/${lesson.id}`}
                className="font-semibold text-foreground hover:text-accent"
              >
                {lesson.title}
              </Link>
              <p className="text-xs text-muted">{lesson.estimated_minutes} min</p>
            </div>
            {lesson.completed ? <Badge tone="success">Done</Badge> : <Badge>Todo</Badge>}
          </li>
        ))}
      </ol>
    </div>
  );
}
