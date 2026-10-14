import Link from "next/link";
import { CopyCode } from "@/components/copy-code";
import { FileDownloadButton } from "@/components/file-download-button";
import { formatBytes } from "@/lib/format";
import type { ChallengeFile } from "@/lib/types";

/**
 * "Access the Lab" card for V1 static artifact labs.
 * Server Component — lists downloadable artifacts plus copyable
 * target/objective text. There is no live infrastructure in V1.
 */
export function LabActionHub({
  challengeId,
  files,
  targetText,
  objectiveText,
  authenticated,
}: {
  challengeId: number;
  files: ChallengeFile[];
  targetText: string;
  objectiveText: string;
  authenticated: boolean;
}) {
  const copyText = `Target: ${targetText}\nObjective: ${objectiveText}`;

  return (
    <section
      aria-labelledby="lab-access-heading"
      data-testid="lab-action-hub"
      className="rounded-xl border border-border bg-surface p-5 shadow-sm"
    >
      <h2 id="lab-access-heading" className="type-eyebrow text-accent">
        Access the lab
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        Static artifact lab — no live infrastructure. Download the files below and work
        locally.
      </p>

      {files.length === 0 ? (
        <p className="mt-4 text-sm text-muted" data-testid="lab-action-hub-empty">
          No artifact files attached. Analyze the briefing and submit the flag.
        </p>
      ) : (
        <ul className="mt-4 space-y-2" aria-label="Lab artifact files">
          {files.map((file) => (
            <li
              key={file.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-surface-raised px-3 py-2"
            >
              <div className="min-w-0">
                <p className="truncate font-mono text-[13px] text-foreground">
                  {file.original_name}
                </p>
                <p className="font-mono text-[11px] text-faint">
                  {formatBytes(file.size_bytes)} · {file.mime_type}
                </p>
              </div>
              {authenticated ? (
                <FileDownloadButton challengeId={challengeId} file={file} />
              ) : (
                <Link
                  href="/login"
                  className="text-sm text-accent hover:text-accent-hover hover:underline"
                >
                  Log in to download
                </Link>
              )}
            </li>
          ))}
        </ul>
      )}

      <div className="relative mt-4 rounded-lg border border-border bg-surface-raised p-3 pe-16">
        <h3 className="font-mono text-[11px] uppercase tracking-[0.14em] text-faint">
          Lab briefing (copy)
        </h3>
        <pre
          className="mt-2 font-mono text-xs leading-relaxed whitespace-pre-wrap text-muted"
          data-testid="lab-action-hub-copy-text"
        >
          {copyText}
        </pre>
        <CopyCode text={copyText} />
      </div>
    </section>
  );
}
