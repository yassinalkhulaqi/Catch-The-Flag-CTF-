import type { Metadata } from "next";
import Link from "next/link";
import { ChallengeForm } from "@/components/admin/challenge-form";
import { Card } from "@/components/ui/card";
import { getCategoriesServer } from "@/lib/api/admin-server";

export const metadata: Metadata = { title: "Admin · New challenge" };

/** Challenge authoring entry point (categories resolved server-side). */
export default async function AdminChallengeNewPage() {
  const categories = await getCategoriesServer();

  return (
    <div>
      <p className="text-sm text-muted">
        <Link href="/admin/challenges" className="hover:text-accent">
          ← Challenges
        </Link>
      </p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
        New challenge
      </h1>
      <p className="mt-1 text-sm text-muted">
        Drafts are invisible to learners until published. Files, hints and
        flags are added after creation.
      </p>
      <Card className="mt-6">
        <ChallengeForm
          mode="create"
          categories={categories.map((c) => ({
            id: c.id,
            name: c.name,
            slug: c.slug,
          }))}
        />
      </Card>
    </div>
  );
}
