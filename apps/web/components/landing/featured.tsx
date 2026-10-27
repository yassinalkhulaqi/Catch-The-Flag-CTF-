import { ChallengeCard } from "@/components/challenge-card";
import { SectionHeading } from "@/components/landing/section-heading";
import { PathCard } from "@/components/path-card";
import { Reveal } from "@/lib/motion/reveal";
import type { ChallengeSummary, PathSummary } from "@/lib/types";

export function FeaturedPaths({ paths }: { paths: PathSummary[] }) {
  if (paths.length === 0) return null;
  return (
    <section className="border-t border-border" aria-labelledby="featured-paths">
      <div className="mx-auto max-w-6xl px-4 py-16 lg:py-20">
        <SectionHeading
          id="featured-paths"
          eyebrow="// Learning paths"
          title="Start with the case, not the tool"
          description="Each path pairs the theory with a challenge you can actually submit against."
          href="/paths"
          linkLabel="View all paths"
        />
        <div className="grid gap-3 md:grid-cols-2">
          {paths.map((path, index) => (
            <Reveal key={path.id} delay={index * 70}>
              <PathCard path={path} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export function FeaturedChallenges({ challenges }: { challenges: ChallengeSummary[] }) {
  if (challenges.length === 0) return null;
  return (
    <section
      className="relative border-t border-border bg-background/80"
      aria-labelledby="featured-challenges"
    >
      <div className="mx-auto max-w-6xl px-4 py-16 lg:py-20">
        <SectionHeading
          id="featured-challenges"
          eyebrow="// Field work"
          title="Fresh from the catalog"
          description="Pick an artifact, work offline, and submit the flag. Hints cost points; the flag never comes back."
          href="/challenges"
          linkLabel="Browse challenges"
        />
        <div className="grid gap-3 md:grid-cols-2">
          {challenges.slice(0, 4).map((challenge, index) => (
            <Reveal key={challenge.id} delay={index * 60}>
              <ChallengeCard challenge={challenge} variant="tile" />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
