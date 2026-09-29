import { Badge } from "@/components/ui/badge";
import type { Difficulty } from "@/lib/types";

const TONE: Record<Difficulty, "neutral" | "info" | "accent" | "danger"> = {
  beginner: "info",
  intermediate: "accent",
  advanced: "danger",
  expert: "danger",
};

export function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  return (
    <Badge tone={TONE[difficulty]} data-testid="difficulty-badge">
      {difficulty}
    </Badge>
  );
}
