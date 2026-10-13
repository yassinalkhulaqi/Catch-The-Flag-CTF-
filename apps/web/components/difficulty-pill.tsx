import { Badge } from "@/components/ui/badge";
import type { Difficulty } from "@/lib/types";

const tones = {
  beginner: "success",
  intermediate: "info",
  advanced: "accent",
  expert: "danger",
} as const;

/** Small difficulty indicator used by cards and detail headers. */
export function DifficultyPill({
  difficulty,
  className,
}: {
  difficulty: Difficulty;
  className?: string;
}) {
  return (
    <Badge tone={tones[difficulty] ?? "neutral"} className={className}>
      {difficulty}
    </Badge>
  );
}
