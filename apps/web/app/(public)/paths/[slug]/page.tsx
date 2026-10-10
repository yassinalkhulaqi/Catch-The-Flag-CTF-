import Link from "next/link";
import { notFound } from "next/navigation";
import { DifficultyBadge } from "@/components/difficulty-badge";
import { ErrorState, PageHeader } from "@/components/empty-state";
import { StartPathButton } from "@/components/learning-actions";
import { PathMap } from "@/components/path-map";
import { PathPrerequisites } from "@/components/path-prerequisites";
import { Markdown } from "@/components/markdown";
import { buttonVariants } from "@/components/ui/button";
import { ApiError } from "@/lib/api/client";
import { getCurrentUser, serverApi } from "@/lib/api/server";
import { cn } from "@/lib/utils";
import type { PathDetail } from "@/lib/types";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  try {
    const res = await serverApi<{ data: PathDetail }>("GET", `/paths/${slug}`);
    return { title: res.data.title };
  } catch {
    return { title: "Path" };
  }
}

export default async function PathDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const user = await getCurrentUser();

  let path: PathDetail | null = null;
  try {
    const res = await serverApi<{ data: PathDetail }>("GET", `/paths/${slug}`);
    path = res.data;
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    return (
      <div className="mx-auto max-w-6xl px-4 py-10">
        <ErrorState title="Path unavailable" />
      </div>
    );
  }

  if (!path) notFound();

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <PageHeader
        eyebrow={path.category?.name ?? "Path"}
        title={path.title}
        description={path.summary}
        actions={
          <div className="flex flex-col items-end gap-2">
            <DifficultyBadge difficulty={path.difficulty} />
            {user ? (
              path.started || path.progress_percent > 0 ? (
                <p className="font-mono text-xs text-accent">{path.progress_percent}% complete</p>
              ) : path.can_start ? (
                <StartPathButton pathId={path.id} />
              ) : (
                <p className="max-w-xs text-end text-sm text-muted">
                  Complete the required paths before starting this one.
                </p>
              )
            ) : (
              <Link href="/login" className={cn(buttonVariants("primary", "sm"))}>
                Sign in to start
              </Link>
            )}
          </div>
        }
      />

      {path.description ? (
        <div className="mb-10 max-w-3xl">
          <Markdown content={path.description} />
        </div>
      ) : null}

      <PathPrerequisites items={path.prerequisites} />

      <section aria-labelledby="modules-heading">
        <h2
          id="modules-heading"
          className="mb-4 font-mono text-xs uppercase tracking-[0.16em] text-accent"
        >
          Modules
        </h2>
        <PathMap
          modules={path.modules}
          locked={!path.can_start && !path.started && path.progress_percent === 0}
          canOpen={!!user && (path.can_start || path.started || path.progress_percent > 0)}
        />
      </section>
    </div>
  );
}
