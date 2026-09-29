import Link from "next/link";
import { ChallengeCard } from "@/components/challenge-card";
import { PathCard } from "@/components/path-card";
import { buttonVariants } from "@/components/ui/button";
import { serverApi } from "@/lib/api/server";
import { cn } from "@/lib/utils";
import type { ChallengeSummary, Paginated, PathSummary } from "@/lib/types";

export const metadata = {
  title: "Catch The Flag",
  description: "Learn. Hunt. Capture. — cybersecurity learning paths and static CTF challenges.",
};

export default async function LandingPage() {
  let paths: PathSummary[] = [];
  let challenges: ChallengeSummary[] = [];

  try {
    const [pathRes, challengeRes] = await Promise.all([
      serverApi<Paginated<PathSummary>>("GET", "/paths?per_page=3"),
      serverApi<Paginated<ChallengeSummary>>("GET", "/challenges?per_page=5"),
    ]);
    paths = pathRes.data;
    challenges = challengeRes.data;
  } catch {
    /* Featured sections stay empty when API is unavailable. */
  }

  return (
    <div className="atmosphere relative overflow-hidden">
      <section className="relative mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-6xl flex-col justify-center px-4 py-16 sm:py-24">
        <div className="pointer-events-none absolute inset-y-10 right-[-10%] hidden w-[48%] lg:block" aria-hidden="true">
          <HeroMark />
        </div>

        <p className="animate-fade-up font-mono text-xs uppercase tracking-[0.28em] text-accent">
          CTF
        </p>

        <h1 className="animate-fade-up-delay mt-4 max-w-3xl font-display text-5xl font-semibold tracking-tight text-foreground sm:text-6xl lg:text-7xl">
          Catch The Flag
        </h1>

        <p className="animate-fade-up-delay-2 mt-5 max-w-xl text-lg text-muted sm:text-xl">
          Learn. Hunt. Capture.
        </p>

        <div className="animate-fade-up-delay-2 mt-10 flex flex-wrap gap-3">
          <Link href="/register" className={cn(buttonVariants("primary", "lg"))}>
            Get started
          </Link>
          <Link href="/challenges" className={cn(buttonVariants("outline", "lg"))}>
            Browse challenges
          </Link>
        </div>
      </section>

      <section className="border-t border-border bg-background/80" aria-labelledby="how-heading">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h2 id="how-heading" className="font-display text-2xl font-semibold text-foreground">
            How it works
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            Study a path, download challenge files, submit flags, and earn XP — all server-side.
          </p>
          <div className="mt-10 grid gap-10 md:grid-cols-3">
            <Feature
              label="01"
              title="Follow a path"
              body="Theory → practice → challenge. Build DFIR, malware, RE, and crypto skills with a clear curriculum."
            />
            <Feature
              label="02"
              title="Hunt static CTFs"
              body="Download files, analyze artifacts, unlock hints, and submit flags — no live lab risk in V1."
            />
            <Feature
              label="03"
              title="Earn honest XP"
              body="XP, solves, achievements, and a deterministic leaderboard computed only on the server."
            />
          </div>
        </div>
      </section>

      {paths.length > 0 ? (
        <section className="border-t border-border" aria-labelledby="featured-paths">
          <div className="mx-auto max-w-6xl px-4 py-16">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 id="featured-paths" className="font-display text-2xl font-semibold text-foreground">
                  Featured paths
                </h2>
                <p className="mt-2 text-sm text-muted">Published learning paths from the catalog.</p>
              </div>
              <Link href="/paths" className="text-sm text-accent hover:underline">
                View all paths
              </Link>
            </div>
            <div className="border-t border-border">
              {paths.map((p) => (
                <PathCard key={p.id} path={p} />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {challenges.length > 0 ? (
        <section className="border-t border-border bg-background/80" aria-labelledby="featured-challenges">
          <div className="mx-auto max-w-6xl px-4 py-16">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2
                  id="featured-challenges"
                  className="font-display text-2xl font-semibold text-foreground"
                >
                  Featured challenges
                </h2>
                <p className="mt-2 text-sm text-muted">Published static CTF challenges ready to solve.</p>
              </div>
              <Link href="/challenges" className="text-sm text-accent hover:underline">
                Browse challenges
              </Link>
            </div>
            <div className="border-t border-border">
              {challenges.map((c) => (
                <ChallengeCard key={c.id} challenge={c} />
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}

function Feature({
  label,
  title,
  body,
}: {
  label: string;
  title: string;
  body: string;
}) {
  return (
    <div>
      <p className="font-mono text-xs text-accent">{label}</p>
      <h3 className="mt-2 font-display text-xl font-semibold text-foreground">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted">{body}</p>
    </div>
  );
}

function HeroMark() {
  return (
    <svg
      viewBox="0 0 320 360"
      className="animate-flag-draw h-full w-full text-border-strong opacity-70"
      fill="none"
    >
      <path d="M72 24v312" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path
        d="M72 48h168l-36 54 36 54H78"
        stroke="var(--accent)"
        strokeWidth="3"
        strokeLinejoin="round"
        fill="color-mix(in srgb, var(--accent) 12%, transparent)"
      />
      <path d="M40 336h220" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
