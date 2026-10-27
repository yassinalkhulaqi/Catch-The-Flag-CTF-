import Link from "next/link";
import { Download, FileArchive, LockKeyhole } from "lucide-react";
import { challengeFilePath, formatBytes } from "@/lib/format";
import type { ChallengeFile } from "@/lib/types";

export function ChallengeFiles({
  challengeId,
  files,
  authenticated,
}: {
  challengeId: number;
  files: ChallengeFile[];
  authenticated: boolean;
}) {
  if (files.length === 0) {
    return <p className="text-sm text-muted">No files attached.</p>;
  }

  return (
    <ul className="grid gap-2 sm:grid-cols-2">
      {files.map((file) => {
        const href = authenticated
          ? challengeFilePath(challengeId, file.id)
          : `/login?next=/challenges/`;
        return (
          <li
            key={file.id}
            className="group flex items-center justify-between gap-3 rounded-xl border border-border bg-surface px-4 py-3 transition-colors hover:border-border-strong"
          >
            <div className="flex min-w-0 items-center gap-3">
              <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-surface-raised text-accent">
                <FileArchive aria-hidden="true" className="size-4" />
              </span>
              <div className="min-w-0">
                <p className="truncate font-mono text-sm text-foreground">
                  {file.original_name}
                </p>
                <p className="text-xs text-faint">
                  {formatBytes(file.size_bytes)} · {file.mime_type}
                </p>
              </div>
            </div>
            {authenticated ? (
              <a
                href={href}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs text-accent transition-colors hover:border-accent/40 hover:bg-accent/10"
                download={file.original_name}
              >
                <Download aria-hidden="true" className="size-3.5" />
                Download
              </a>
            ) : (
              <Link
                href="/login"
                className="inline-flex shrink-0 items-center gap-1.5 text-xs text-accent hover:text-accent-hover"
              >
                <LockKeyhole aria-hidden="true" className="size-3.5" />
                Log in
              </Link>
            )}
          </li>
        );
      })}
    </ul>
  );
}
