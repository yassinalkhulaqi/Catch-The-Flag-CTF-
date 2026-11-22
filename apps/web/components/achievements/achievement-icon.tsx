import { Award, Droplet, Flag, Lock, Map, Star, Trophy } from "lucide-react";

const ICONS: Record<string, typeof Award> = {
  flag: Flag,
  trophy: Trophy,
  star: Star,
  map: Map,
  droplet: Droplet,
  lock: Lock,
};

export function AchievementIcon({
  icon,
  className,
}: {
  icon?: string | null;
  className?: string;
}) {
  const Icon = icon ? (ICONS[icon.toLowerCase()] ?? Award) : Award;
  return <Icon aria-hidden="true" className={className} />;
}
