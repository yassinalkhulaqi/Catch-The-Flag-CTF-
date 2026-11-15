import { redirect } from "next/navigation";

/**
 * Legacy single-page authoring UI was retired into the six-step challenge
 * wizard. Kept as a permanent redirect so old bookmarks and emails keep
 * working, intact with the challenge id in the path.
 */
export default async function AdminChallengeDetailRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/admin/challenges/${id}/edit`);
}
