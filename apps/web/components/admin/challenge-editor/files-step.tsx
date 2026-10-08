import { Button } from "@/components/ui/button";
import type { ChallengeFile } from "@/lib/types";

export function FilesStep({
  id,
  files,
  pending,
  onUpload,
  onDelete,
}: {
  id: string;
  files: ChallengeFile[];
  pending: boolean;
  onUpload: (file: File) => void;
  onDelete: (fileId: number) => void;
}) {
  return (
    <section className="space-y-3" aria-labelledby={`${id}-files`}>
      <h2 id={`${id}-files`} className="font-mono text-xs uppercase tracking-[0.16em] text-accent">
        Files
      </h2>
      <p className="text-sm text-muted">
        Files are stored as opaque evidence. The server assigns the storage key and detects the type.
      </p>
      <input
        type="file"
        aria-label="Upload challenge file"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onUpload(file);
          e.target.value = "";
        }}
      />
      <ul className="divide-y divide-border border border-border">
        {files.length === 0 ? <li className="px-3 py-2 text-sm text-muted">No files yet.</li> : null}
        {files.map((file) => (
          <li key={file.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
            <span className="font-mono">{file.original_name}</span>
            <Button type="button" variant="ghost" size="sm" onClick={() => onDelete(file.id)} disabled={pending}>
              Remove
            </Button>
          </li>
        ))}
      </ul>
    </section>
  );
}
