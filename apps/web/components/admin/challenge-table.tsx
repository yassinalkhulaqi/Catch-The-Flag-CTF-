"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Suspense } from "react";
import { DataTable } from "@/components/admin/data-table";
import { DifficultyBadge } from "@/components/difficulty-badge";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api/client";
import { formatXp } from "@/lib/utils";
import type { ChallengeSummary, ContentStatus } from "@/lib/types";

export function ChallengeTable({ rows }: { rows: ChallengeSummary[] }) {
  return (
    <Suspense fallback={<p className="text-sm text-muted">Loading table…</p>}>
      <ChallengeTableInner rows={rows} />
    </Suspense>
  );
}

function ChallengeTableInner({ rows }: { rows: ChallengeSummary[] }) {
  const router = useRouter();

  async function setStatus(row: ChallengeSummary, action: "archive" | "publish") {
    if (action === "archive" && row.status === "archived") return;
    if (action === "publish" && row.status === "published") return;
    await api.post(`/admin/challenges/${row.id}/${action}`);
    router.refresh();
  }

  return (
    <DataTable
      caption="Admin challenges"
      rows={rows}
      searchText={(row) => `${row.title} ${row.slug} ${row.category.name} ${row.status}`}
      rowLabel={(row) => row.title}
      bulkActions={[
        { id: "archive", label: "Archive selected", run: (row) => setStatus(row, "archive") },
        { id: "publish", label: "Publish selected", run: (row) => setStatus(row, "publish") },
      ]}
      columns={[
        {
          id: "title",
          header: "Title",
          sortValue: (row) => row.title,
          cell: (row) => (
            <Link href={`/admin/challenges/${row.id}/edit`} className="font-semibold hover:text-accent">
              {row.title}
            </Link>
          ),
        },
        {
          id: "status",
          header: "Status",
          sortValue: (row) => row.status,
          cell: (row) => <StatusBadge status={row.status} />,
        },
        {
          id: "difficulty",
          header: "Difficulty",
          sortValue: (row) => row.difficulty,
          cell: (row) => <DifficultyBadge difficulty={row.difficulty} />,
        },
        {
          id: "points",
          header: "Points",
          sortValue: (row) => row.points,
          cell: (row) => <span className="font-mono">{formatXp(row.points)}</span>,
        },
        {
          id: "category",
          header: "Category",
          sortValue: (row) => row.category.name,
          cell: (row) => row.category.name,
        },
      ]}
    />
  );
}

function StatusBadge({ status }: { status: ContentStatus }) {
  const tone = status === "published" ? "success" : status === "archived" ? "neutral" : "warning";
  return <Badge tone={tone}>{status}</Badge>;
}
