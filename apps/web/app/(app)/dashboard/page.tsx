import Link from "next/link";
import { ActivityHeatmap, heatmapFromTimestamps } from "@/components/charts/activity-heatmap";
import { OnboardingTour } from "@/components/onboarding/tour";
import { SkillRadar } from "@/components/charts/skill-radar";
import { PageHeader } from "@/components/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { requireUser } from "@/lib/auth";
import { serverApi } from "@/lib/api/server";
import { levelFromXp } from "@/lib/design/level";
import { dictionaryFor } from "@/lib/i18n/dictionary";
import { getLocale } from "@/lib/theme/locale";
import { CountUp } from "@/lib/motion/count-up";
import { ProgressRing } from "@/lib/motion/progress-ring";
import { cn, formatXp } from "@/lib/utils";
import type {
  Achievement,
  ChallengeSummary,
  ModuleDetail,
  Paginated,
  PathDetail,
  PathSummary,
  ProgressOverview,
  XpEntry,
  Category,
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
  const copy = dictionaryFor(await getLocale());

  let progress: ProgressOverview | null = null;
  let paths: PathSummary[] = [];
  let challenges: ChallengeSummary[] = [];
  let achievements: Achievement[] = [];
  let ledger: XpEntry[] = [];
  let solvedChallenges: ChallengeSummary[] = [];
  let categories: Category[] = [];

  try {
    const [prog, pathRes, challengeRes, achRes, ledgerRes, solvedRes, categoryRes] = await Promise.all([
      serverApi<{ data: ProgressOverview }>("GET", "/me/progress"),
      serverApi<Paginated<PathSummary>>("GET", "/paths?per_page=20"),
      serverApi<Paginated<ChallengeSummary>>("GET", "/challenges?per_page=10"),
      serverApi<{ data: Achievement[] }>("GET", "/me/achievements"),
      serverApi<Paginated<XpEntry>>("GET", "/me/xp-ledger?per_page=100"),
      serverApi<Paginated<ChallengeSummary>>("GET", "/challenges?solved=true&per_page=100"),
      serverApi<{ data: Category[] }>("GET", "/categories"),
    ]);
    progress = prog.data;
    paths = pathRes.data;
    challenges = challengeRes.data;
    achievements = achRes.data.filter((a) => a.awarded).slice(0, 4);
    ledger = ledgerRes.data;
    solvedChallenges = solvedRes.data;
    categories = categoryRes.data;
  } catch {
    /* partial dashboard still useful with user payload */
  }

  const nextAction = await resolveNextAction(paths, challenges);
  const xp = progress?.xp ?? user.xp;
  const level = levelFromXp(xp);
  const radar = radarFromSolves(solvedChallenges);
  const ctaLabel =
    nextAction.kind === "lesson"
      ? "Continue lesson"
      : nextAction.kind === "challenge"
        ? "Solve challenge"
        : "Browse paths";

  return (
    <div>
      <OnboardingTour userId={user.id} categories={categories} challenges={challenges} />
      <PageHeader
        eyebrow="Dashboard"
        title={`Welcome, ${user.name}`}
        description={copy.pages.dashboardBody}
      />

      <div className="grid gap-4 lg:grid-cols-[auto_1fr]">
        <div className="flex items-center gap-4 rounded-xl border border-border bg-surface p-4">
          <ProgressRing
            ratio={level.ratio}
            label={`Level ${level.level}, ${level.into} of ${level.span} XP toward the next level`}
            center={
              <span>
                <span className="block font-display text-2xl font-semibold">{level.level}</span>
                <span className="block font-mono text-[10px] uppercase text-muted">level</span>
              </span>
            }
          />
          <div>
            <p className="type-eyebrow text-accent">XP</p>
            <p className="font-display text-3xl font-semibold">
              <CountUp value={xp} />
            </p>
            <p className="text-sm text-muted">
              {formatXp(level.span - level.into)} XP to level {level.level + 1}. Streak {progress?.streak_days ?? 0} days.
            </p>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Stat label="Solves" value={String(progress?.challenges_solved ?? user.solved_count)} />
          <Stat label="Paths started" value={String(progress?.paths_started ?? 0)} />
          <Stat label="Rank" value={progress?.rank != null ? `#${progress.rank}` : "—"} />
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-border bg-surface p-4" aria-labelledby="heat-heading">
          <h2 id="heat-heading" className="sr-only">
            Recent XP activity
          </h2>
          <ActivityHeatmap cells={heatmapFromTimestamps(ledger.map((entry) => entry.created_at))} />
          <p className="mt-3 text-xs text-muted">Each cell is a day with an XP ledger row. Empty days stay quiet.</p>
        </section>
        <section className="rounded-xl border border-border bg-surface p-4" aria-labelledby="radar-heading">
          <h2 id="radar-heading" className="type-eyebrow text-accent">
            Solves by discipline
          </h2>
          {radar.length === 0 ? (
            <p className="mt-3 text-sm text-muted">Solve a challenge and this chart fills in from the server.</p>
          ) : (
            <SkillRadar points={radar} />
          )}
        </section>
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

function radarFromSolves(challenges: ChallengeSummary[]) {
  const counts = new Map<string, number>();
  for (const challenge of challenges) {
    const label = challenge.category.name;
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  const max = Math.max(1, ...counts.values());
  return [...counts.entries()].map(([label, value]) => ({ label, value, max }));
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-border bg-surface p-4">
      <p className="font-mono text-[11px] uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-2 font-display text-2xl font-semibold text-foreground">{value}</p>
    </div>
  );
}
