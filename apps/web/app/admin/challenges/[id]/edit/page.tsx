import { notFound } from "next/navigation";
import { ChallengeEditor } from "@/components/admin/challenge-editor";
import { ErrorState, PageHeader } from "@/components/empty-state";
import { ApiError } from "@/lib/api/client";
import { requireStaff } from "@/lib/auth";
import { serverApi } from "@/lib/api/server";
import type {
  Category,
  ChallengeDetail,
  ChallengeFlagMeta,
  ChallengeHint,
  Tag,
} from "@/lib/types";

export const metadata = { title: "Edit challenge" };

export default async function EditChallengePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireStaff();
  const { id } = await params;

  let challenge: ChallengeDetail | null = null;
  let categories: Category[] = [];
  let tags: Tag[] = [];
  let hints: ChallengeHint[] = [];
  let flags: ChallengeFlagMeta[] = [];
  let loadError = false;

  try {
    const [challengeRes, cats, tagRes, hintsRes, flagsRes] = await Promise.all([
      serverApi<{ data: ChallengeDetail }>("GET", `/admin/challenges/${id}`),
      serverApi<{ data: Category[] }>("GET", "/categories"),
      serverApi<{ data: Tag[] }>("GET", "/tags"),
      serverApi<{ data: ChallengeHint[] }>("GET", `/admin/challenges/${id}/hints`),
      serverApi<{ data: ChallengeFlagMeta[] }>("GET", `/admin/challenges/${id}/flags`),
    ]);
    challenge = challengeRes.data;
    categories = cats.data;
    tags = tagRes.data;
    hints = hintsRes.data;
    flags = flagsRes.data;
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    loadError = true;
  }

  if (loadError) return <ErrorState title="Could not load challenge" />;
  if (!challenge) notFound();

  return (
    <div>
      <PageHeader
        eyebrow="Authoring"
        title={`Edit · ${challenge.title}`}
        description={`Status: ${challenge.status}`}
      />
      <ChallengeEditor
        categories={categories}
        tags={tags}
        challenge={challenge}
        initialHints={hints}
        initialFlags={flags}
      />
    </div>
  );
}
