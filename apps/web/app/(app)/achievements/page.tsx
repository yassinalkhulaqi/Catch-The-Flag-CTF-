import type { Metadata } from "next";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { serverApi } from "@/lib/api/server";
import type { Achievement } from "@/lib/types";

export const metadata: Metadata = { title: "Achievements" };

async function getAchievements(): Promise<Achievement[]> {
  try {
    const res = await serverApi<{ data: Achievement[] }>(
      "GET",
      "/me/achievements",
    );
    return res.data;
  } catch {
    return [];
  }
}

export default async function AchievementsPage() {
  const items = await getAchievements();

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
        Achievements
      </h1>
      <p className="mt-1 text-muted">
        Awarded server-side for real milestones — never for clicking around.
      </p>
      {items.length === 0 ? (
        <Card className="mt-6">
          <CardTitle>No achievements yet</CardTitle>
          <CardDescription className="mt-2">
            Complete lessons, solve challenges and climb the ranks to earn
            them.
          </CardDescription>
        </Card>
      ) : (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2">
          {items.map((a) => (
            <li key={a.id}>
              <Card className={a.awarded ? "" : "opacity-60"}>
                <CardTitle>{a.title}</CardTitle>
                <CardDescription className="mt-2">
                  {a.description}
                </CardDescription>
                <p className="mt-2 font-mono text-xs text-faint">
                  {a.awarded
                    ? `Awarded${a.awarded_at ? ` · ${new Date(a.awarded_at).toLocaleDateString()}` : ""}`
                    : a.progress
                      ? `${a.progress.current}/${a.progress.target}`
                      : "Locked"}
                </p>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
