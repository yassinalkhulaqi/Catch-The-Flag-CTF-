import { Markdown } from "@/components/markdown";
import { Button } from "@/components/ui/button";
import type { ContentStatus } from "@/lib/types";

export function PublishStep({
  id,
  title,
  scenario,
  description,
  status,
  hasActiveFlag,
  pending,
  onAction,
}: {
  id: string;
  title: string;
  scenario: string;
  description: string;
  status?: ContentStatus;
  hasActiveFlag: boolean;
  pending: boolean;
  onAction: (action: "publish" | "unpublish" | "review" | "archive") => void;
}) {
  return (
    <section className="space-y-4" aria-labelledby={`${id}-publish`}>
      <h2 id={`${id}-publish`} className="font-mono text-xs uppercase tracking-[0.16em] text-accent">
        Preview and publish
      </h2>
      <ul className="space-y-1 text-sm">
        <li className={title.trim() && description.trim() ? "text-success" : "text-danger"}>
          {title.trim() && description.trim() ? "Title and description are set." : "Title and description are required."}
        </li>
        <li className={hasActiveFlag ? "text-success" : "text-danger"}>
          {hasActiveFlag ? "An active flag is configured." : "An active flag is required before publish."}
        </li>
        <li className="text-muted">Current status: {status ?? "unsaved"}</li>
      </ul>
      <div className="flex flex-wrap gap-2">
        {status !== "published" ? (
          <Button type="button" variant="secondary" disabled={pending || !hasActiveFlag} onClick={() => onAction("publish")}>
            Publish
          </Button>
        ) : (
          <Button type="button" variant="outline" disabled={pending} onClick={() => onAction("unpublish")}>
            Unpublish
          </Button>
        )}
        {status === "draft" ? (
          <Button type="button" variant="ghost" disabled={pending} onClick={() => onAction("review")}>
            Submit for review
          </Button>
        ) : null}
        {status && status !== "archived" ? (
          <Button type="button" variant="ghost" disabled={pending} onClick={() => onAction("archive")}>
            Archive
          </Button>
        ) : null}
      </div>
      <div className="border border-border bg-surface p-4">
        <p className="mb-3 font-mono text-xs uppercase tracking-[0.16em] text-faint">Learner preview</p>
        {scenario.trim() ? <Markdown content={scenario} /> : null}
        {description.trim() ? <Markdown content={description} /> : <p className="text-sm text-muted">Nothing to preview yet.</p>}
      </div>
    </section>
  );
}
