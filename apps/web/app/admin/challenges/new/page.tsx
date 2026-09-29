import { PageHeader } from "@/components/empty-state";
import { ChallengeEditor } from "@/components/admin/challenge-editor";
import { requireStaff } from "@/lib/auth";
import { serverApi } from "@/lib/api/server";
import type { Category, Tag } from "@/lib/types";

export const metadata = { title: "New challenge" };

export default async function NewChallengePage() {
  await requireStaff();
  const [cats, tags] = await Promise.all([
    serverApi<{ data: Category[] }>("GET", "/categories"),
    serverApi<{ data: Tag[] }>("GET", "/tags"),
  ]);

  return (
    <div>
      <PageHeader eyebrow="Authoring" title="New challenge" />
      <ChallengeEditor categories={cats.data} tags={tags.data} />
    </div>
  );
}
