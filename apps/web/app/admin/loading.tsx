import { Skeleton } from "@/components/ui/skeleton";

export default function AdminLoading() {
  return (
    <div className="space-y-3" aria-busy="true">
      <Skeleton className="h-8 w-48" label="Loading admin page" />
      <Skeleton className="h-40 w-full" label="Loading admin content" />
    </div>
  );
}
