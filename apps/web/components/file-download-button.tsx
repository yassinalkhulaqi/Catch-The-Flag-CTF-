import { Download } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import type { ChallengeFile } from "@/lib/types";

/**
 * Attachment download link for the challenge detail page. Server Component —
 * a same-origin anchor is enough; the browser (with the session cookie) and
 * the BFF proxy handle auth. The `download` attribute suggests the original
 * filename; size/sha256 labels stay with the caller.
 */
export function FileDownloadButton({
  challengeId,
  file,
}: {
  challengeId: number;
  file: Pick<ChallengeFile, "id" | "original_name">;
}) {
  return (
    <a
      href={`/api/v1/challenges/${challengeId}/files/${file.id}/download`}
      download={file.original_name}
      aria-label={`Download ${file.original_name}`}
      className={buttonVariants("outline", "sm")}
    >
      <Download aria-hidden="true" className="size-3.5" />
      Download
    </a>
  );
}
