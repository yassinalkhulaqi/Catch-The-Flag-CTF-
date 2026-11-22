import { Skeleton } from "@/components/ui/skeleton";

export default function AchievementsLoading() {
  return (
    <div className="space-y-6" aria-busy="true">
      <Skeleton className="h-72 rounded-2xl" label="Loading trophy cabinet" />
      <Skeleton className="h-24 rounded-2xl" label="Loading badge controls" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton
            key={index}
            className="h-52 rounded-2xl"
            label="Loading badge"
          />
        ))}
      </div>
    </div>
  );
}
