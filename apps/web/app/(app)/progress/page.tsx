import type { Metadata } from "next";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { serverApi } from "@/lib/api/server";

export const metadata: Metadata = { title: "My progress" };

interface PathProgress {
  id: number;
  title: string;
  slug: string;
  progress_percent: number;
  completed: boolean;
}

async function getProgress(): Promise<PathProgress[]> {
  try {
    const res = await serverApi<{ data: PathProgress[] }>(
      "GET",
      "/me/progress",
    );
    return Array.isArray(res.data) ? res.data : [];
  } catch {
    return [];
  }
}

export default async function ProgressPage() {
  const items = await getProgress();

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
        My progress
      </h1>
      <p className="mt-1 text-muted">
        Paths you started and how far you have come.
      </p>
      {items.length === 0 ? (
        <Card className="mt-6">
          <CardTitle>Nothing in progress</CardTitle>
          <CardDescription className="mt-2">
            Start a path to track completion here.
          </CardDescription>
        </Card>
      ) : (
        <ul className="mt-6 space-y-3">
          {items.map((p) => (
            <li key={p.id}>
              <Card>
                <CardTitle>{p.title}</CardTitle>
                <div
                  className="mt-3 h-2 overflow-hidden rounded-full bg-border"
                  role="progressbar"
                  aria-valuenow={p.progress_percent}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${p.title} progress`}
                >
                  <div
                    className="h-full rounded-full bg-accent"
                    style={{ width: `${p.progress_percent}%` }}
                  />
                </div>
                <p className="mt-2 font-mono text-xs text-faint">
                  {p.progress_percent}%{p.completed ? " · completed" : ""}
                </p>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
