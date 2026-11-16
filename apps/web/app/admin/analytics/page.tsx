import { PageHeader, ErrorState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { getAdminAnalyticsServer } from "@/lib/api/admin-server";
import { formatXp } from "@/lib/utils";

export const metadata = { title: "Admin · Analytics" };

/** Staff analytics: totals, per-category solve funnel, 30-day XP activity. */
export default async function AdminAnalyticsPage() {
  const analytics = await getAdminAnalyticsServer();

  if (!analytics || !analytics.summary) {
    return <ErrorState title="Analytics unavailable" description="The staff analytics endpoint could not be reached." />;
  }

  const { summary } = analytics;
  const maxXp = Math.max(1, ...analytics.series.map((point) => point.xp));

  const statCards = [
    { label: "Learners", value: formatXp(summary.users), hint: "Registered accounts" },
    { label: "Solves", value: formatXp(summary.solves_total), hint: "Unique challenge solves, all time" },
    { label: "Solve rate", value: `${summary.solve_rate}%`, hint: "Solves ÷ attempts, all time" },
    { label: "XP awarded", value: formatXp(summary.xp_total), hint: "Sum of the XP ledger" },
    { label: "Registrations 30d", value: formatXp(summary.registrations_30d), hint: "New learners in the last month" },
    { label: "Active 30d", value: formatXp(summary.active_learners_30d), hint: "Earned XP in the last 30 days" },
  ];

  return (
    <div>
      <PageHeader
        eyebrow="Insights"
        title="Analytics"
        description="Direct counts over the source-of-truth tables. Attempts are flag submissions; solves are unique learner solves."
      />

      <section aria-label="Headline numbers" className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map((card) => (
          <Card key={card.label}>
            <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted">
              {card.label}
            </CardTitle>
            <p className="mt-2 text-2xl font-semibold text-foreground">{card.value}</p>
            <CardDescription className="mt-1">{card.hint}</CardDescription>
          </Card>
        ))}
      </section>

      <section aria-label="XP awarded per day" className="mt-8">
        <h2 className="text-sm font-medium text-muted">XP awarded per day · last 30 days</h2>
        {analytics.series.every((point) => point.xp === 0) ? (
          <p className="mt-2 text-sm text-muted">No XP awarded in this window yet.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <div className="flex h-40 min-w-[46rem] items-end gap-1">
              {analytics.series.map((point) => (
                <div
                  key={point.day}
                  className="flex min-w-0 flex-1 flex-col items-center justify-end gap-1"
                  title={`${point.day}: ${formatXp(point.xp)} XP`}
                >
                  <span className="font-mono text-[9px] text-faint">
                    {point.xp > 0 ? formatXp(point.xp) : ""}
                  </span>
                  <div
                    role="img"
                    aria-label={`${point.day}: ${formatXp(point.xp)} XP`}
                    className="w-full rounded-sm bg-accent"
                    style={{ height: `${Math.max(2, (point.xp / maxXp) * 100)}%` }}
                  />
                </div>
              ))}
            </div>
            <div className="mt-1 flex min-w-[46rem] justify-between font-mono text-[9px] text-faint">
              <span>{analytics.series[0]?.day}</span>
              <span>{analytics.series[analytics.series.length - 1]?.day}</span>
            </div>
          </div>
        )}
      </section>

      <section aria-label="Solve rate by category" className="mt-8">
        <h2 className="text-sm font-medium text-muted">Solve funnel by category</h2>
        {analytics.categories.length === 0 ? (
          <p className="mt-2 text-sm text-muted">No published challenges yet.</p>
        ) : (
          <div className="mt-3 overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[40rem] text-left text-sm">
              <thead className="bg-surface text-muted">
                <tr>
                  <th scope="col" className="px-4 py-2.5 font-medium">Category</th>
                  <th scope="col" className="px-4 py-2.5 text-right font-medium">Published</th>
                  <th scope="col" className="px-4 py-2.5 text-right font-medium">Attempts</th>
                  <th scope="col" className="px-4 py-2.5 text-right font-medium">Solves</th>
                  <th scope="col" className="px-4 py-2.5 text-right font-medium">Solve rate</th>
                </tr>
              </thead>
              <tbody>
                {analytics.categories.map((row) => (
                  <tr key={row.slug} className="border-t border-border align-middle">
                    <td className="px-4 py-2.5 font-medium text-foreground">
                      {row.category}
                      {row.solve_rate >= 50 ? (
                        <Badge tone="success" className="ms-2 normal-case">healthy</Badge>
                      ) : row.solve_rate < 15 && row.attempts > 20 ? (
                        <Badge tone="warning" className="ms-2 normal-case">hard</Badge>
                      ) : null}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-muted">{row.published}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-muted">{row.attempts}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-muted">{row.solves}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-muted">{row.solve_rate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

    </div>
  );
}
