import Link from "next/link";
import { notFound } from "next/navigation";
import { BookOpen, CheckCircle2, Clock3, Layers, Route } from "lucide-react";
import { DifficultyBadge } from "@/components/difficulty-badge";
import { ErrorState } from "@/components/empty-state";
import { StartPathButton } from "@/components/learning-actions";
import { PathPrerequisites } from "@/components/path-prerequisites";
import { Markdown } from "@/components/markdown";
import { Badge } from "@/components/ui/badge";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { buttonVariants } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
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

  const stats = [
    { label: "Modules", value: path.module_count, icon: Layers },
    { label: "Lessons", value: path.lesson_count, icon: BookOpen },
    { label: "Challenges", value: path.challenge_count, icon: Route },
    { label: "Minutes", value: path.estimated_minutes, icon: Clock3 },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <Breadcrumb
        className="mb-5"
        items={[
          { href: "/paths", label: "Paths" },
          ...(path.category
            ? [{ href: `/challenges?category=${path.category.slug}`, label: path.category.name }]
            : []),
          { label: path.title },
        ]}
      />

      <section className="relative overflow-hidden rounded-2xl border border-border bg-surface/60 p-6 sm:p-8">
        <div aria-hidden="true" className="aurora pointer-events-none absolute inset-0 opacity-60" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              {path.category ? (
                <span className="font-mono text-[11px] uppercase tracking-wide text-accent">
                  {path.category.name}
                </span>
              ) : null}
              <DifficultyBadge difficulty={path.difficulty} />
              {path.completed ? (
                <Badge tone="success" dot>
                  Completed
                </Badge>
              ) : null}
            </div>
            <h1 className="type-title mt-2 text-balance">{path.title}</h1>
            <p className="mt-3 text-sm leading-relaxed text-muted sm:text-base">{path.summary}</p>
            <dl className="mt-6 grid max-w-2xl grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-4">
              {stats.map((stat) => {
                const Icon = stat.icon;
                return (
                  <div key={stat.label} className="bg-surface px-4 py-3">
                    <dt className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wide text-faint">
                      <Icon aria-hidden="true" className="size-3 text-accent" />
                      {stat.label}
                    </dt>
                    <dd className="mt-1 font-display text-xl font-semibold tabular-nums">
                      {stat.value}
                    </dd>
                  </div>
                );
              })}
            </dl>
          </div>

          <div className="flex w-full flex-col gap-4 lg:w-64 lg:shrink-0 lg:items-end">
            {user ? (
              path.started || path.progress_percent > 0 ? (
                <div className="w-full rounded-xl border border-border bg-surface p-4">
                  <div className="flex items-center justify-between font-mono text-[11px] uppercase tracking-wide text-muted">
                    <span>Progress</span>
                    <span className="text-accent">{path.progress_percent}%</span>
                  </div>
                  <Progress
                    value={path.progress_percent}
                    label={`${path.progress_percent}% complete`}
                    className="mt-2"
                  />
                  <p className="mt-3 text-xs text-muted">
                    Pick up where you left off in the module list below.
                  </p>
                </div>
              ) : path.can_start ? (
                <StartPathButton pathId={path.id} />
              ) : (
                <p className="rounded-xl border border-warning/30 bg-warning/10 p-3 text-sm text-warning">
                  Complete the required paths before starting this one.
                </p>
              )
            ) : (
              <Link href="/login" className={cn(buttonVariants("primary", "md"), "w-full")}>
                Sign in to start
              </Link>
            )}
          </div>
        </div>
      </section>

      {path.description ? (
        <div className="mt-8 max-w-3xl">
          <Markdown content={path.description} />
        </div>
      ) : null}

      <PathPrerequisites items={path.prerequisites} />

      <section className="mt-10" aria-labelledby="modules-heading">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="modules-heading" className="type-heading">
            Modules
          </h2>
          <Badge tone="neutral" className="normal-case">
            {path.modules.length} modules
          </Badge>
        </div>
        <ol className="mt-5 space-y-3">
          {path.modules.map((mod) => {
            const done =
              mod.lesson_count > 0 && mod.completed_lesson_count >= mod.lesson_count;
            return (
              <li
                key={mod.id}
                className={cn(
                  "rounded-xl border bg-surface p-4 transition-colors sm:p-5",
                  done ? "border-success/30 bg-success/5" : "border-border hover:border-border-strong",
                )}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex min-w-0 gap-3">
                    <span
                      aria-hidden="true"
                      className={cn(
                        "mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-lg border font-mono text-xs",
                        done
                          ? "border-success/30 bg-success/10 text-success"
                          : "border-border bg-surface-raised text-faint",
                      )}
                    >
                      {done ? (
                        <CheckCircle2 className="size-4" />
                      ) : (
                        String(mod.position).padStart(2, "0")
                      )}
                    </span>
                    <div className="min-w-0">
                      <p className="font-mono text-[10px] uppercase tracking-wide text-faint">
                        Module {mod.position}
                      </p>
                      <h3 className="mt-0.5 text-base font-semibold">{mod.title}</h3>
                      {mod.description ? (
                        <p className="mt-1 text-sm text-muted">{mod.description}</p>
                      ) : null}
                      <div className="mt-3 max-w-xs">
                        <div className="mb-1 flex justify-between font-mono text-[10px] text-faint">
                          <span>
                            {mod.completed_lesson_count}/{mod.lesson_count} lessons
                          </span>
                          {done ? <span className="text-success">Complete</span> : null}
                        </div>
                        <Progress
                          value={mod.completed_lesson_count}
                          max={mod.lesson_count}
                          label={`${mod.title} progress`}
                          tone={done ? "success" : "accent"}
                          size="sm"
                        />
                      </div>
                    </div>
                  </div>
                  {user && (path.can_start || path.started || path.progress_percent > 0) ? (
                    <Link
                      href={`/modules/${mod.id}`}
                      className={cn(buttonVariants("outline", "sm"))}
                    >
                      Open module
                    </Link>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}
