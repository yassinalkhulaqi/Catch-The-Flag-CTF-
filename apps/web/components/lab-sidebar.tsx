import Link from "next/link";
import { Clock3, Flag, Lightbulb, Trophy, UserRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatXp } from "@/lib/utils";
import type { ChallengeDetail } from "@/lib/types";

const SECTIONS = [
  { href: "#lab-objective-heading", label: "Objective" },
  { href: "#briefing-heading", label: "Briefing" },
  { href: "#lab-access-heading", label: "Artifacts" },
  { href: "#submit-heading", label: "Submit" },
  { href: "#hints-heading", label: "Hints" },
] as const;

export function LabSidebar({
  challenge,
  authenticated,
}: {
  challenge: ChallengeDetail;
  authenticated: boolean;
}) {
  const unlockedHints = challenge.hints.filter((hint) => hint.unlocked).length;

  return (
    <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start" aria-label="Lab details">
      <div className="overflow-hidden rounded-2xl border border-border bg-surface/70">
        <div className="border-b border-border bg-surface-raised/40 px-5 py-3">
          <p className="type-eyebrow text-accent">Mission control</p>
        </div>
        <dl className="grid grid-cols-2 gap-px bg-border">
          <div className="bg-surface px-4 py-3">
            <dt className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wide text-faint">
              <Flag aria-hidden="true" className="size-3 text-accent" />
              Points left
            </dt>
            <dd className="mt-1 font-display text-xl font-semibold tabular-nums">
              {formatXp(challenge.points_remaining)}
            </dd>
          </div>
          <div className="bg-surface px-4 py-3">
            <dt className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wide text-faint">
              <Trophy aria-hidden="true" className="size-3 text-accent" />
              Solves
            </dt>
            <dd className="mt-1 font-display text-xl font-semibold tabular-nums">
              {challenge.solve_count}
            </dd>
          </div>
          <div className="bg-surface px-4 py-3">
            <dt className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wide text-faint">
              <Clock3 aria-hidden="true" className="size-3 text-accent" />
              Est. time
            </dt>
            <dd className="mt-1 font-mono text-sm text-foreground">
              ~{challenge.estimated_minutes} min
            </dd>
          </div>
          <div className="bg-surface px-4 py-3">
            <dt className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wide text-faint">
              <Lightbulb aria-hidden="true" className="size-3 text-accent" />
              Hints
            </dt>
            <dd className="mt-1 font-mono text-sm text-foreground">
              {unlockedHints}/{challenge.hints.length}
            </dd>
          </div>
        </dl>
        <div className="space-y-3 border-t border-border px-5 py-4">
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="text-muted">Status</span>
            {challenge.solved ? (
              <Badge tone="success" dot>
                Solved
              </Badge>
            ) : (
              <Badge tone="neutral" dot>
                Unsolved
              </Badge>
            )}
          </div>
          {!authenticated ? (
            <Link
              href="/login"
              className="block rounded-lg border border-accent/30 bg-accent/10 px-3 py-2 text-center text-sm text-accent transition-colors hover:bg-accent/20"
            >
              Sign in to submit
            </Link>
          ) : null}
        </div>
      </div>

      <nav
        aria-label="On this page"
        className="rounded-2xl border border-border bg-surface/70 p-4"
      >
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-faint">On this page</p>
        <ol className="mt-3 space-y-1">
          {SECTIONS.map((section, index) => (
            <li key={section.href}>
              <a
                href={section.href}
                className="group flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted transition-colors hover:bg-surface-raised hover:text-foreground"
              >
                <span className="font-mono text-[10px] text-faint group-hover:text-accent">
                  0{index + 1}
                </span>
                {section.label}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      {challenge.tags.length > 0 ? (
        <div className="rounded-2xl border border-border bg-surface/70 p-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-faint">Tags</p>
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {challenge.tags.map((tag) => (
              <li key={tag.id}>
                <Link href={`/challenges?tags=${tag.slug}`}>
                  <Badge tone="neutral" className="transition-colors hover:border-accent/40 hover:text-accent">
                    {tag.name}
                  </Badge>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {challenge.author ? (
        <p className="flex items-center gap-2 px-2 text-xs text-faint">
          <UserRound aria-hidden="true" className="size-3.5" />
          Authored by {challenge.author.name}
        </p>
      ) : null}
    </aside>
  );
}
