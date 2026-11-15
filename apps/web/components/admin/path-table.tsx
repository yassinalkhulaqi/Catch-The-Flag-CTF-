"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Suspense } from "react";
import { DataTable } from "@/components/admin/data-table";
import { DifficultyBadge } from "@/components/difficulty-badge";
import { Badge } from "@/components/ui/badge";
import { transitionAdminPath } from "@/lib/api/admin";
import type { ContentStatus, Difficulty } from "@/lib/types";

interface AdminPathRow {
  id: number;
  title: string;
  slug: string;
  summary: string;
  difficulty: Difficulty;
  status: ContentStatus;
}

/** Sortable/searchable path table with bulk publish/archive. */
export function PathTable({ rows }: { rows: AdminPathRow[] }) {
  return (
    <Suspense fallback={<p className="text-sm text-muted">Loading table…</p>}>
      <PathTableInner rows={rows} />
    </Suspense>
  );
}

function PathTableInner({ rows }: { rows: AdminPathRow[] }) {
  const router = useRouter();

  async function setStatus(row: AdminPathRow, action: "publish" | "archive") {
    if (action === "publish" && row.status === "published") return;
    if (action === "archive" && row.status === "archived") return;
    await transitionAdminPath(row.id, action);
    router.refresh();
  }

  return (
    <DataTable
      caption="Admin learning paths"
      rows={rows}
      searchText={(row) => `${row.title} ${row.slug} ${row.status}`}
      rowLabel={(row) => row.title}
      bulkActions={[
        { id: "archive", label: "Archive selected", run: (row) => setStatus(row, "archive") },
        { id: "publish", label: "Publish selected", run: (row) => setStatus(row, "publish") },
      ]}
      empty="No paths yet — create one above."
      columns={[
        {
          id: "title",
          header: "Title",
          sortValue: (row) => row.title,
          cell: (row) => (
            <Link href={`/admin/paths/${row.id}/edit`} className="font-semibold hover:text-accent">
              {row.title}
            </Link>
          ),
        },
        {
          id: "status",
          header: "Status",
          sortValue: (row) => row.status,
          cell: (row) => <Badge>{row.status}</Badge>,
        },
        {
          id: "difficulty",
          header: "Difficulty",
          sortValue: (row) => row.difficulty,
          cell: (row) => <DifficultyBadge difficulty={row.difficulty} />,
        },
        {
          id: "slug",
          header: "Slug",
          sortValue: (row) => row.slug,
          cell: (row) => <span className="font-mono text-xs text-faint">{row.slug}</span>,
        },
      ]}
    />
  );
}
