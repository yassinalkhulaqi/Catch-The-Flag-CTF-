import Link from "next/link";
import { ChallengeTable } from "@/components/admin/challenge-table";
import { EmptyState, ErrorState, PageHeader } from "@/components/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { requireStaff } from "@/lib/auth";
import { serverApi } from "@/lib/api/server";
import { cn } from "@/lib/utils";
import type { ChallengeSummary, Paginated } from "@/lib/types";

export const metadata = { title: "Admin · Challenges" };

export default async function AdminChallengesPage() {
  await requireStaff();

  let items: ChallengeSummary[] = [];
  let loadError = false;
  try {
    const res = await serverApi<Paginated<ChallengeSummary>>(
      "GET",
      "/admin/challenges?per_page=50",
    );
    items = res.data;
  } catch {
    loadError = true;
  }

  return (
    <div>
      <PageHeader
        eyebrow="Authoring"
        title="Challenges"
        description="Create, edit, and publish static challenges."
        actions={
          <Link href="/admin/challenges/new" className={cn(buttonVariants("primary", "sm"))}>
            New challenge
          </Link>
        }
      />
      {loadError ? (
        <ErrorState description="The challenge list could not be loaded. Retry from the admin navigation." />
      ) : items.length === 0 ? (
        <EmptyState
          title="No challenges yet"
          description="Create a draft, add a write-only flag, then publish."
          action={
            <Link href="/admin/challenges/new" className={cn(buttonVariants("primary", "sm"))}>
              New challenge
            </Link>
          }
        />
      ) : (
        <ChallengeTable rows={items} />
      )}
    </div>
  );
}
