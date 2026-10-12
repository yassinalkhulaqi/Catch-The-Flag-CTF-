import type { Metadata } from "next";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/api/server";
import { formatXp } from "@/lib/utils";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage() {
  const user = await getCurrentUser();

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
        Profile
      </h1>
      <p className="mt-1 text-muted">How the leaderboard sees you.</p>
      <Card className="mt-6">
        <CardTitle>{user?.name ?? "—"}</CardTitle>
        <CardDescription className="mt-2">
          {user?.email ?? "—"}
          {user?.bio ? ` · ${user.bio}` : ""}
        </CardDescription>
        <p className="mt-3 font-mono text-xs text-faint">
          {user ? `${formatXp(user.xp)} XP · ${user.solved_count} solves` : ""}
        </p>
      </Card>
    </div>
  );
}
