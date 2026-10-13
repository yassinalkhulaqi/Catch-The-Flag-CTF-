import type { Metadata } from "next";
import Link from "next/link";
import { ChallengeForm } from "@/components/admin/challenge-form";
import { ChallengeTransitions } from "@/components/admin/challenge-transitions";
import { FileUploader } from "@/components/admin/file-uploader";
import { FlagManager } from "@/components/admin/flag-manager";
import { HintManager } from "@/components/admin/hint-manager";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import {
  getAdminChallengeServer,
  getCategoriesServer,
  listAdminChallengeFilesServer,
  listAdminChallengeFlagsServer,
  listAdminChallengeHintsServer,
} from "@/lib/api/admin-server";

export const metadata: Metadata = { title: "Admin · Edit challenge" };

function Section({
  id,
  title,
  body,
  children,
}: {
  id: string;
  title: string;
  body?: string;
  children: React.ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="mt-6">
      <Card>
        <CardTitle id={id}>{title}</CardTitle>
        {body ? <CardDescription className="mt-1">{body}</CardDescription> : null}
        <div className="mt-4">{children}</div>
      </Card>
    </section>
  );
}

/**
 * Challenge authoring detail: edit form, lifecycle transitions, files,
 * hints, and write-only flags. Never throws — a missing challenge renders
 * an empty state.
 */
export default async function AdminChallengeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [challenge, categories, files, hints, flags] = await Promise.all([
    getAdminChallengeServer(id),
    getCategoriesServer(),
    listAdminChallengeFilesServer(id),
    listAdminChallengeHintsServer(id),
    listAdminChallengeFlagsServer(id),
  ]);

  if (!challenge) {
    return (
      <div>
        <p className="text-sm text-muted">
          <Link href="/admin/challenges" className="hover:text-accent">
            ← Challenges
          </Link>
        </p>
        <Card className="mt-4">
          <CardTitle>Challenge not found</CardTitle>
          <CardDescription className="mt-2">
            It may have been deleted, or the API is unreachable.
          </CardDescription>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <p className="text-sm text-muted">
        <Link href="/admin/challenges" className="hover:text-accent">
          ← Challenges
        </Link>
      </p>
      <div className="mt-1 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {challenge.title}
        </h1>
        <Badge tone={challenge.status === "published" ? "success" : "neutral"}>
          {challenge.status}
        </Badge>
      </div>
      <p className="mt-1 font-mono text-xs text-faint">
        #{challenge.id} · {challenge.slug}
      </p>

      <Section id="edit" title="Content" body="Writable fields. Status and flags are managed below.">
        <ChallengeForm
          mode="edit"
          challengeId={challenge.id}
          initial={{
            title: challenge.title,
            slug: challenge.slug,
            description: challenge.description ?? "",
            scenario: challenge.scenario ?? "",
            category_id: challenge.category_id,
            difficulty: challenge.difficulty,
            points: challenge.points,
          }}
          categories={categories.map((c) => ({
            id: c.id,
            name: c.name,
            slug: c.slug,
          }))}
        />
      </Section>

      <Section id="lifecycle" title="Lifecycle" body="Publishing controls visibility to learners.">
        <ChallengeTransitions challengeId={challenge.id} status={challenge.status} />
      </Section>

      <Section id="files" title={`Files (${files.length})`} body="Private artifacts served only through the authorized download endpoint.">
        <FileUploader challengeId={challenge.id} initialFiles={files} />
      </Section>

      <Section id="hints" title={`Hints (${hints.length})`} body="Ordered nudges with point costs, deducted on unlock.">
        <HintManager challengeId={challenge.id} initialHints={hints} />
      </Section>

      <Section id="flags" title={`Flags (${flags.length})`} body="Accepted solutions. Values are write-only.">
        <FlagManager challengeId={challenge.id} initialFlags={flags} />
      </Section>
    </div>
  );
}
