import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ChallengeFlagMeta } from "@/lib/types";

export function FlagStep({
  id,
  flags,
  value,
  label,
  pending,
  onValue,
  onLabel,
  onSave,
}: {
  id: string;
  flags: ChallengeFlagMeta[];
  value: string;
  label: string;
  pending: boolean;
  onValue: (value: string) => void;
  onLabel: (value: string) => void;
  onSave: () => void;
}) {
  const hasActive = flags.some((flag) => flag.is_active);

  return (
    <section className="space-y-3" aria-labelledby={`${id}-flag`}>
      <h2 id={`${id}-flag`} className="font-mono text-xs uppercase tracking-[0.16em] text-accent">
        Flag (write-only)
      </h2>
      <p className="text-sm text-muted">
        Flag values are never returned by the API after save. Replace a flag by setting a new value.
      </p>
      <div className="grid gap-3 md:grid-cols-[1fr_160px_auto]">
        <Input
          type="password"
          autoComplete="off"
          placeholder="flag{…}"
          value={value}
          onChange={(e) => onValue(e.target.value)}
          aria-label="Flag value"
        />
        <Input
          placeholder="Label"
          value={label}
          onChange={(e) => onLabel(e.target.value)}
          aria-label="Flag label"
        />
        <Button type="button" onClick={onSave} disabled={pending}>
          Set flag
        </Button>
      </div>
      <ul className="divide-y divide-border border border-border text-sm">
        {flags.map((flag) => (
          <li key={flag.id} className="flex justify-between px-3 py-2">
            <span>
              {flag.label || "unnamed"} · {flag.is_active ? "active" : "inactive"}
            </span>
            <span className="font-mono text-xs text-faint">
              {flag.case_sensitive ? "case-sensitive" : "case-insensitive"}
            </span>
          </li>
        ))}
        {flags.length === 0 ? <li className="px-3 py-2 text-muted">No flag configured yet.</li> : null}
      </ul>
      <p className="text-sm text-muted" role="status">
        {hasActive ? "An active flag is configured." : "Publish requires an active flag."}
      </p>
    </section>
  );
}
