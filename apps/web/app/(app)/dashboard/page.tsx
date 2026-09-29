import Link from "next/link";
import { EmptyState, PageHeader } from "@/components/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { requireUser } from "@/lib/auth";
import { serverApi } from "@/lib/api/server";
import { cn, formatXp } from "@/lib/utils";
import type {
  Achievement,
  Paginated,
  PathSummary,
  ProgressOverview,
} from "@/lib/types";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const user = await requireUser();

  let progress: ProgressOverview | null = null;
  let paths: PathSummary[] = [];
  let achievements: Achievement[] = [];

  try {
    const [prog, pathRes, achRes] = await Promise.all([
      serverApi<{ data: ProgressOverview }>("GET", "/me/progress"),
      serverApi<Paginated<PathSummary>>("GET", "/paths?per_page=20"),
      serverApi<{ data: Achievement[] }>("GET", "/me/achievements"),
    ]);
    progress = prog.data;
    paths = pathRes.data;
    achievements = achRes.data.filter((a) => a.awarded).slice(0, 4);
  } catch {
    /* partial dashboard still useful with user payload */
  }

  const inProgress = paths.filter((p) => p.progress_percent > 0 && p.progress_percent < 100);
  const nextPath = inProgress[0] ?? paths.find((p) => p.progress_percent === 0) ?? null;

  return (
    <div>
      <PageHeader
        eyebrow="Dashboard"
        title={`Welcome, ${user.name}`}
        description="Continue learning, track XP, and see what to tackle next."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="XP" value={formatXp(progress?.xp ?? user.xp)} />
        <Stat label="Solves" value={String(progress?.challenges_solved ?? user.solved_count)} />
        <Stat label="Paths started" value={String(progress?.paths_started ?? 0)} />
        <Stat
          label="Rank"
          value={progress?.rank != null ? `#${progress.rank}` : "—"}
        />
      </div>

      <section className="mt-10" aria-labelledby="continue-heading">
        <h2 id="continue-heading" className="font-mono text-xs uppercase tracking-[0.16em] text-accent">
          Continue learning
        </h2>
        {nextPath ? (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-4 border border-border bg-surface p-5">
            <div>
              <p className="text-base font-semibold text-foreground">{nextPath.title}</p>
              <p className="mt-1 text-sm text-muted">{nextPath.summary}</p>
              {nextPath.progress_percent > 0 ? (
                <p className="mt-2 font-mono text-xs text-accent">
                  {nextPath.progress_percent}% complete
                </p>
              ) : null}
            </div>
            <Link
              href={`/paths/${nextPath.slug}`}
              className={cn(buttonVariants("primary", "sm"))}
            >
              {nextPath.progress_percent > 0 ? "Resume" : "Start"}
            </Link>
          </div>
        ) : (
          <EmptyState
            className="mt-3"
            title="No paths yet"
            description="Browse published learning paths to get started."
            action={
              <Link href="/paths" className={cn(buttonVariants("outline", "sm"))}>
                View paths
              </Link>
            }
          />
        )}
      </section>

      <section className="mt-10" aria-labelledby="ach-heading">
        <div className="mb-3 flex items-center justify-between">
          <h2 id="ach-heading" className="font-mono text-xs uppercase tracking-[0.16em] text-accent">
            Recent achievements
          </h2>
          <Link href="/achievements" className="text-sm text-muted hover:text-foreground">
            View all
          </Link>
        </div>
        {achievements.length === 0 ? (
          <p className="text-sm text-muted">No achievements unlocked yet — keep hunting.</p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {achievements.map((a) => (
              <li key={a.id} className="border border-border bg-surface p-4">
                <p className="font-semibold text-foreground">{a.title}</p>
                <p className="mt-1 text-sm text-muted">{a.description}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link href="/challenges" className={cn(buttonVariants("outline", "sm"))}>
          Browse challenges
        </Link>
        <Link href="/solves" className={cn(buttonVariants("ghost", "sm"))}>
          My solves
        </Link>
        <Link href="/leaderboard" className={cn(buttonVariants("ghost", "sm"))}>
          Leaderboard
        </Link>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-border bg-surface p-4">
      <p className="font-mono text-[11px] uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-2 font-display text-2xl font-semibold text-foreground">{value}</p>
    </div>
  );
}
