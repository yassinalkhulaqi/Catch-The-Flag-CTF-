import Link from "next/link";
import { DifficultyPill } from "@/components/difficulty-pill";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import type { ChallengeSummary } from "@/lib/types";

/** Card for challenge listings. Server Component — no interactivity. */
export function ChallengeCard({ challenge }: { challenge: ChallengeSummary }) {
  return (
    <Card className="flex h-full flex-col">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="neutral">{challenge.category.name}</Badge>
        <DifficultyPill difficulty={challenge.difficulty} />
        {challenge.solved ? <Badge tone="success">Solved</Badge> : null}
      </div>
      <CardTitle className="mt-3 text-base">
        <Link
          href={`/challenges/${challenge.slug}`}
          className="hover:text-accent"
        >
          {challenge.title}
        </Link>
      </CardTitle>
      <CardDescription className="mt-2">
        {challenge.points} pts · {challenge.solve_count}{" "}
        {challenge.solve_count === 1 ? "solve" : "solves"} · ~
        {challenge.estimated_minutes} min
      </CardDescription>
      {challenge.tags.length > 0 ? (
        <p className="mt-3 font-mono text-xs text-faint">
          {challenge.tags.map((t) => `#${t.slug}`).join(" ")}
        </p>
      ) : null}
    </Card>
  );
}
