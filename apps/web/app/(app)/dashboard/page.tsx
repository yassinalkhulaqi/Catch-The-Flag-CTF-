import Link from "next/link";
import { PageHeader } from "@/components/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { requireUser } from "@/lib/auth";
import { serverApi } from "@/lib/api/server";
import { cn, formatXp } from "@/lib/utils";
import type {
  Achievement,
  ChallengeSummary,
  ModuleDetail,
  Paginated,
  PathDetail,
  PathSummary,
  ProgressOverview,
} from "@/lib/types";

export const metadata = { title: "Dashboard" };

type NextAction =
  | { kind: "lesson"; href: string; title: string; subtitle: string }
  | { kind: "challenge"; href: string; title: string; subtitle: string }
  | { kind: "browse"; href: string; title: string; subtitle: string };

async function resolveNextAction(
  paths: PathSummary[],
  challenges: ChallengeSummary[],
): Promise<NextAction> {
  const inProgress = paths.find(
    (p) => p.progress_percent > 0 && p.progress_percent < 100,
  );

  if (inProgress) {
    try {
      const pathRes = await serverApi<{ data: PathDetail }>(
        "GET",
        `/paths/${inProgress.slug}`,
      );
      const path = pathRes.data;
      const modules = [...path.modules].sort((a, b) => a.position - b.position);
      const incompleteModule =
        modules.find((m) => m.completed_lesson_count < m.lesson_count) ??
        modules[0];

      if (incompleteModule) {
        const modRes = await serverApi<{ data: ModuleDetail }>(
          "GET",
          `/modules/${incompleteModule.id}`,
        );
        const lessons = [...modRes.data.lessons].sort(
          (a, b) => a.position - b.position,
        );
        const nextLesson =
          lessons.find((l) => !l.completed) ?? lessons[0] ?? null;

        if (nextLesson) {
          return {
            kind: "lesson",
            href: `/lessons/${nextLesson.id}`,
            title: nextLesson.title,
            subtitle: `Continue ${path.title} · ${path.progress_percent}% complete`,
          };
        }
      }

      return {
        kind: "lesson",
        href: `/paths/${path.slug}`,
        title: path.title,
        subtitle: `Resume path · ${path.progress_percent}% complete`,
      };
    } catch {
      return {
        kind: "lesson",
        href: `/paths/${inProgress.slug}`,
        title: inProgress.title,
        subtitle: `Resume path · ${inProgress.progress_percent}% complete`,
      };
    }
  }

  const unsolved = challenges.find((c) => !c.solved);
  if (unsolved) {
    return {
      kind: "challenge",
      href: `/challenges/${unsolved.slug}`,
      title: unsolved.title,
      subtitle: `${unsolved.category.name} · ${unsolved.difficulty} · recommended next challenge`,
    };
  }

  return {
    kind: "browse",
    href: "/paths",
    title: "Browse learning paths",
    subtitle: "Pick a path to start structured theory → practice → CTF.",
  };
}

export default async function DashboardPage() {
  const user = await requireUser();

  let progress: ProgressOverview | null = null;
  let paths: PathSummary[] = [];
  let challenges: ChallengeSummary[] = [];
  let achievements: Achievement[] = [];

  try {
    const [prog, pathRes, challengeRes, achRes] = await Promise.all([
      serverApi<{ data: ProgressOverview }>("GET", "/me/progress"),
      serverApi<Paginated<PathSummary>>("GET", "/paths?per_page=20"),
      serverApi<Paginated<ChallengeSummary>>("GET", "/challenges?per_page=10"),
      serverApi<{ data: Achievement[] }>("GET", "/me/achievements"),
    ]);
    progress = prog.data;
    paths = pathRes.data;
    challenges = challengeRes.data;
    achievements = achRes.data.filter((a) => a.awarded).slice(0, 4);
  } catch {
    /* partial dashboard still useful with user payload */
  }

  const nextAction = await resolveNextAction(paths, challenges);
  const ctaLabel =
    nextAction.kind === "lesson"
      ? "Continue lesson"
      : nextAction.kind === "challenge"
        ? "Solve challenge"
        : "Browse paths";

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

      <section className="mt-10" aria-labelledby="next-heading">
        <h2 id="next-heading" className="font-mono text-xs uppercase tracking-[0.16em] text-accent">
          Next up
        </h2>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-4 border border-border bg-surface p-5">
          <div>
            <p className="text-base font-semibold text-foreground">{nextAction.title}</p>
            <p className="mt-1 text-sm text-muted">{nextAction.subtitle}</p>
          </div>
          <Link href={nextAction.href} className={cn(buttonVariants("primary", "sm"))}>
            {ctaLabel}
          </Link>
        </div>
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
