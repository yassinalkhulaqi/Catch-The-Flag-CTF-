import { Skeleton } from "@/components/ui/skeleton";

export default function LeaderboardLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10" aria-busy="true">
      <Skeleton className="h-60 rounded-2xl" label="Loading leaderboard summary" />

      <div className="mt-8 grid gap-3 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton
            key={index}
            className="h-44 rounded-2xl"
            label="Loading top players"
          />
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-3">
          <Skeleton className="h-24 rounded-2xl" label="Loading board controls" />
          <Skeleton className="h-[420px] rounded-2xl" label="Loading standings" />
        </div>
        <Skeleton className="h-80 rounded-2xl" label="Loading your standing" />
      </div>
    </div>
  );
}
