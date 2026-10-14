import { Badge } from "@/components/ui/badge";
import { TIER_LABELS, type Tier } from "@/lib/tracks";
import { cn } from "@/lib/utils";

const TONE: Record<Tier, "success" | "warning" | "danger"> = {
  // Apprentice = emerald, Practitioner = amber, Expert = crimson.
  apprentice: "success",
  practitioner: "warning",
  expert: "danger",
};

export function TierPill({ tier, className }: { tier: Tier; className?: string }) {
  return (
    <Badge tone={TONE[tier]} data-testid="tier-pill" className={cn(className)}>
      {TIER_LABELS[tier]}
    </Badge>
  );
}
