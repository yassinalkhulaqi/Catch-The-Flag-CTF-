import Link from "next/link";
import { ChallengeCard } from "@/components/challenge-card";
import { PathCard } from "@/components/path-card";
import { Reveal } from "@/lib/motion/reveal";
import { SpotlightCard } from "@/lib/motion/spotlight";
import { TiltCard } from "@/lib/motion/tilt";
import { CATEGORY_FALLBACKS } from "@/lib/design/category";
import { formatXp } from "@/lib/utils";
import type { Category, ChallengeSummary, LeaderboardEntry, PathSummary } from "@/lib/types";

const STEPS = [
  {
    label: "01",
    title: "Follow a path",
    body: "Theory, then a lesson you mark complete, then a linked challenge. Prerequisites are checked by the server before a path will start.",
  },
  {
    label: "02",
    title: "Hunt static CTFs",
    body: "Download the artifact, work offline, unlock hints if you want to spend points, and submit a flag. No live machines in this version.",
  },
  {
    label: "03",
    title: "Earn honest XP",
    body: "A correct flag writes a solve, an XP ledger row, and your rank. Refreshing the page cannot invent points.",
  },
];

export function HowItWorks() {
  return (
    <section className="border-t border-border" aria-labelledby="how-heading">
      <div className="mx-auto max-w-6xl px-4 py-16">
        <h2 id="how-heading" className="type-title">How it works</h2>
        <p className="mt-3 max-w-2xl text-muted">
          A training ground for SOC analysts, DFIR practitioners, and CTF players. Calm on purpose.
        </p>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {STEPS.map((step, index) => (
            <Reveal key={step.label} delay={index * 80}>
              <SpotlightCard className="h-full p-5">
                <p className="type-eyebrow text-accent">{step.label}</p>
                <h3 className="mt-3 text-xl font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{step.body}</p>
              </SpotlightCard>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export function CatalogStats({
  paths,
  challenges,
  players,
}: {
  paths: number;
  challenges: number;
  players: number;
}) {
  const items = [
    { label: "Published paths", value: String(paths) },
    { label: "Published challenges", value: String(challenges) },
    { label: "Ranked players", value: String(players) },
  ];
  return (
    <section aria-label="Catalog totals" className="border-t border-border bg-surface/40">
      <dl className="mx-auto grid max-w-6xl gap-px bg-border sm:grid-cols-3">
        {items.map((item) => (
          <div key={item.label} className="bg-background px-4 py-8">
            <dt className="type-eyebrow text-muted">{item.label}</dt>
            <dd className="mt-2 font-display text-4xl font-semibold">{item.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function CategoryShowcase({ categories }: { categories: Category[] }) {
  const items = categories.length
    ? categories.map((category) => ({
        slug: category.slug,
        label: category.name,
        detail: category.description ?? "Published challenges in this discipline.",
        color: category.color,
        count: category.challenge_count,
      }))
    : CATEGORY_FALLBACKS.map((category) => ({
        slug: category.slug,
        label: category.label,
        detail: "Seeded discipline. Counts appear when the catalog loads.",
        color: null as string | null,
        count: undefined as number | undefined,
      }));

  return (
    <section className="border-t border-border" aria-labelledby="disciplines-heading">
      <div className="mx-auto max-w-6xl px-4 py-16">
        <h2 id="disciplines-heading" className="type-title">Disciplines</h2>
        <p className="mt-3 max-w-2xl text-muted">
          Eight starting points. New categories are data, not a code change.
        </p>
        <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item) => (
            <li key={item.slug}>
              <TiltCard>
                <Link
                  href={`/challenges?category=${item.slug}`}
                  className="block rounded-xl border border-border bg-surface p-4 hover:border-border-strong"
                >
                  <span
                    aria-hidden="true"
                    className="mb-3 block h-1 w-10 rounded-full"
                    style={{ background: item.color ?? `var(--category-${tokenFor(item.slug)}, var(--accent))` }}
                  />
                  <span className="block font-semibold">{item.label}</span>
                  <span className="mt-1 block text-sm text-muted">{item.detail}</span>
                  {item.count !== undefined ? (
                    <span className="mt-3 block font-mono text-xs text-faint">{item.count} challenges</span>
                  ) : null}
                </Link>
              </TiltCard>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function tokenFor(slug: string): string {
  if (slug.includes("forensic") && slug.includes("network")) return "network";
  if (slug.includes("forensic") || slug === "dfir") return "dfir";
  if (slug.includes("malware")) return "malware";
  if (slug.includes("reverse") || slug === "re") return "re";
  if (slug.includes("crypto")) return "crypto";
  if (slug.includes("osint")) return "osint";
  if (slug.includes("steg")) return "stego";
  if (slug.includes("soc")) return "soc";
  return "soc";
}

export function FeaturedPaths({ paths }: { paths: PathSummary[] }) {
  if (paths.length === 0) return null;
  return (
    <section className="border-t border-border" aria-labelledby="featured-paths">
      <div className="mx-auto max-w-6xl px-4 py-16">
        <div className="mb-6 flex items-end justify-between gap-3">
          <h2 id="featured-paths" className="type-title">Featured paths</h2>
          <Link href="/paths" className="text-sm text-accent hover:underline">
            View all paths
          </Link>
        </div>
        <div className="border-t border-border">
          {paths.map((path) => (
            <PathCard key={path.id} path={path} />
          ))}
        </div>
      </div>
    </section>
  );
}

export function FeaturedChallenges({ challenges }: { challenges: ChallengeSummary[] }) {
  if (challenges.length === 0) return null;
  return (
    <section className="border-t border-border bg-background/80" aria-labelledby="featured-challenges">
      <div className="mx-auto max-w-6xl px-4 py-16">
        <div className="mb-6 flex items-end justify-between gap-3">
          <h2 id="featured-challenges" className="type-title">Featured challenges</h2>
          <Link href="/challenges" className="text-sm text-accent hover:underline">
            Browse challenges
          </Link>
        </div>
        <div className="border-t border-border">
          {challenges.map((challenge) => (
            <ChallengeCard key={challenge.id} challenge={challenge} />
          ))}
        </div>
      </div>
    </section>
  );
}

export function LeaderboardPreview({ entries }: { entries: LeaderboardEntry[] }) {
  if (entries.length === 0) return null;
  return (
    <section className="border-t border-border" aria-labelledby="board-preview">
      <div className="mx-auto max-w-6xl px-4 py-16">
        <div className="mb-6 flex items-end justify-between gap-3">
          <div>
            <h2 id="board-preview" className="type-title">Leaderboard</h2>
            <p className="mt-2 text-sm text-muted">Ordered by XP, then solves, then account id.</p>
          </div>
          <Link href="/leaderboard" className="text-sm text-accent hover:underline">
            Full board
          </Link>
        </div>
        <ol className="grid gap-3 md:grid-cols-3">
          {entries.slice(0, 3).map((entry) => (
            <li key={entry.id} className="rounded-xl border border-border bg-surface p-4">
              <p className="font-mono text-xs text-accent">#{entry.rank}</p>
              <p className="mt-2 text-lg font-semibold">{entry.name}</p>
              <p className="font-mono text-sm text-muted">{formatXp(entry.xp)} XP · {entry.solved_count} solves</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
