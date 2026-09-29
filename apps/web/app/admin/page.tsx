import Link from "next/link";
import { ErrorState, PageHeader } from "@/components/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { requireStaff } from "@/lib/auth";
import { serverApi } from "@/lib/api/server";
import { cn, formatXp } from "@/lib/utils";
import type { AdminStats } from "@/lib/types";

export const metadata = { title: "Admin" };

export default async function AdminHomePage() {
  await requireStaff();

  let stats: AdminStats | null = null;
  try {
    const res = await serverApi<{ data: AdminStats }>("GET", "/admin/stats");
    stats = res.data;
  } catch {
    return <ErrorState title="Could not load admin stats" />;
  }

  return (
    <div>
      <PageHeader
        eyebrow="Overview"
        title="Platform stats"
        description="Published content and solve activity."
        actions={
          <Link href="/admin/challenges/new" className={cn(buttonVariants("primary", "sm"))}>
            New challenge
          </Link>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Users" value={formatXp(stats.users)} />
        <Stat label="Published challenges" value={String(stats.challenges_published)} />
        <Stat label="Published paths" value={String(stats.paths_published)} />
        <Stat label="Total solves" value={formatXp(stats.solves_total)} />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-border bg-surface p-4">
      <p className="font-mono text-[11px] uppercase text-muted">{label}</p>
      <p className="mt-2 font-display text-3xl font-semibold">{value}</p>
    </div>
  );
}
