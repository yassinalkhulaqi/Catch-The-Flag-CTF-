"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import {
  deleteAdminChallengeFile,
  uploadAdminChallengeFile,
  type AdminFileMeta,
} from "@/lib/api/admin";

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(1)} ${units[unit]}`;
}

/**
 * Challenge file manager. Uploads via multipart FormData POST; only file
 * metadata is ever rendered. Uploaded files are treated as hostile: never
 * executed, never rendered inline — metadata + delete only.
 */
export function FileUploader({
  challengeId,
  initialFiles,
}: {
  challengeId: number;
  initialFiles: AdminFileMeta[];
}) {
  const router = useRouter();
  const [files, setFiles] = useState<AdminFileMeta[]>(initialFiles);
  const [selected, setSelected] = useState<File | null>(null);
  const [pending, setPending] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onUpload(e: React.FormEvent) {
    e.preventDefault();
    if (pending || deleting !== null) return;
    if (!selected) {
      setError("Choose a file to upload first.");
      return;
    }
    setPending(true);
    setError(null);
    const result = await uploadAdminChallengeFile(challengeId, selected);
    setPending(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setFiles((prev) => [...prev, result.data]);
    setSelected(null);
    router.refresh();
  }

  async function onDelete(fileId: number) {
    if (pending || deleting !== null) return;
    setDeleting(fileId);
    setError(null);
    const result = await deleteAdminChallengeFile(challengeId, fileId);
    setDeleting(null);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
    router.refresh();
  }

  return (
    <div>
      {error ? (
        <p role="alert" className="mb-3 text-sm text-danger">
          {error}
        </p>
      ) : null}

      <form onSubmit={onUpload} className="flex flex-wrap items-end gap-3">
        <Field label="Challenge file" htmlFor="challenge-file">
          <Input
            id="challenge-file"
            type="file"
            onChange={(e) => setSelected(e.target.files?.[0] ?? null)}
          />
        </Field>
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Uploading…" : "Upload file"}
        </Button>
      </form>
      <p className="mt-1 text-xs text-faint">
        Files are stored privately and served only through the authorized
        download endpoint.
      </p>

      {files.length === 0 ? (
        <p className="mt-4 text-sm text-muted">No files attached yet.</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {files.map((f) => (
            <li
              key={f.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border bg-surface-raised px-3 py-2"
            >
              <span className="min-w-0">
                <span className="block truncate font-mono text-xs text-foreground">
                  {f.original_name}
                </span>
                <span className="text-xs text-faint">
                  {formatBytes(f.size_bytes)}
                  {f.mime_type ? ` · ${f.mime_type}` : ""}
                </span>
              </span>
              <Button
                variant="danger"
                size="sm"
                disabled={deleting !== null || pending}
                onClick={() => onDelete(f.id)}
                aria-label={`Delete file ${f.original_name}`}
              >
                {deleting === f.id ? "Deleting…" : "Delete"}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
