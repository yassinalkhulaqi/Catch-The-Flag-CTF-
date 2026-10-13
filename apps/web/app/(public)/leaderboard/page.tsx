import type { Metadata } from "next";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { getLeaderboard } from "@/lib/api/leaderboard";
import { formatXp } from "@/lib/utils";

export const metadata: Metadata = { title: "Leaderboard" };

const PER_PAGE = 20;

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const parsed = Number.parseInt(params.page ?? "1", 10);
  const page = Number.isFinite(parsed) && parsed > 0 ? parsed : 1;

  const result = await getLeaderboard(page, PER_PAGE);
  const entries = result?.data ?? [];
  const meta = result?.meta ?? null;
  const lastPage = meta?.last_page ?? 1;
  const total = meta?.total ?? entries.length;

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <p className="font-mono text-xs uppercase tracking-widest text-accent">
        Leaderboard
      </p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
        Ranked by XP, then solves
      </h1>
      <p className="mt-3 text-muted">
        Deterministic order: XP descending, solved count descending, account
        age ascending. Computed server-side.
      </p>

      {entries.length === 0 ? (
        <Card className="mt-8">
          <CardTitle>No rankings yet</CardTitle>
          <CardDescription className="mt-2">
            Solve a challenge to take the top spot.
          </CardDescription>
        </Card>
      ) : (
        <>
          <div className="mt-8 overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <caption className="sr-only">
                Leaderboard ranked by XP, then solves
              </caption>
              <thead>
                <tr className="border-b border-border bg-surface-raised font-mono text-xs uppercase tracking-wide text-muted">
                  <th scope="col" className="px-4 py-3 text-left font-medium">
                    Rank
                  </th>
                  <th scope="col" className="px-4 py-3 text-left font-medium">
                    Name
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-right font-medium"
                  >
                    XP
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-right font-medium"
                  >
                    Solves
                  </th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e) => (
                  <tr
                    key={e.id}
                    className="border-b border-border last:border-0"
                  >
                    <td className="px-4 py-3 font-mono text-faint">
                      {String(e.rank).padStart(2, "0")}
                    </td>
                    <th
                      scope="row"
                      className="px-4 py-3 text-left font-semibold text-foreground"
                    >
                      {e.name}
                    </th>
                    <td className="px-4 py-3 text-right font-mono text-muted">
                      {formatXp(e.xp)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-muted">
                      {e.solved_count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <nav
            aria-label="Leaderboard pages"
            className="mt-4 flex items-center justify-between gap-3"
          >
            {page > 1 ? (
              <Link
                href={`/leaderboard?page=${page - 1}`}
                className={buttonVariants("outline", "sm")}
              >
                ← Previous
              </Link>
            ) : (
              <span
                aria-disabled="true"
                className={buttonVariants("outline", "sm", "opacity-50")}
              >
                ← Previous
              </span>
            )}
            <p className="font-mono text-xs text-faint" aria-live="polite">
              Page {page} of {lastPage} · {total}{" "}
              {total === 1 ? "user" : "users"}
            </p>
            {page < lastPage ? (
              <Link
                href={`/leaderboard?page=${page + 1}`}
                className={buttonVariants("outline", "sm")}
              >
                Next →
              </Link>
            ) : (
              <span
                aria-disabled="true"
                className={buttonVariants("outline", "sm", "opacity-50")}
              >
                Next →
              </span>
            )}
          </nav>
        </>
      )}
    </div>
  );
}
