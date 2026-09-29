import Link from "next/link";
import { Download } from "lucide-react";
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
    <ul className="divide-y divide-border border border-border">
      {files.map((file) => {
        const href = authenticated
          ? challengeFilePath(challengeId, file.id)
          : `/login?next=/challenges/`;
        return (
          <li key={file.id} className="flex items-center justify-between gap-3 px-4 py-3">
            <div className="min-w-0">
              <p className="truncate font-mono text-sm text-foreground">
                {file.original_name}
              </p>
              <p className="text-xs text-faint">
                {formatBytes(file.size_bytes)} · {file.mime_type}
              </p>
            </div>
            {authenticated ? (
              <a
                href={href}
                className="inline-flex items-center gap-1.5 text-sm text-accent hover:text-accent-hover"
                download={file.original_name}
              >
                <Download className="size-4" aria-hidden="true" />
                Download
              </a>
            ) : (
              <Link href="/login" className="text-sm text-accent hover:text-accent-hover">
                Log in to download
              </Link>
            )}
          </li>
        );
      })}
    </ul>
  );
}
