import { cn } from "@/lib/utils";

/**
 * Password policy is shown before the user submits (ui-ux-audit.md §3.4).
 * The server remains authoritative — including the common-password denylist.
 */
export function PasswordRequirements({
  password,
  confirmation,
}: {
  password: string;
  confirmation?: string;
}) {
  const checks = [
    { label: "At least 12 characters", ok: password.length >= 12 },
    {
      label: "Passwords match",
      ok: confirmation !== undefined && confirmation.length > 0 && password === confirmation,
    },
  ];

  return (
    <div className="space-y-1" aria-live="polite">
      <ul className="space-y-0.5 text-xs text-muted">
        {checks.map((check) => (
          <li key={check.label} className={cn("flex items-center gap-2", check.ok && "text-success")}>
            <span aria-hidden="true" className="font-mono text-[10px]">
              {check.ok ? "[x]" : "[ ]"}
            </span>
            {check.label}
          </li>
        ))}
      </ul>
      <p className="text-xs text-faint">Common passwords are rejected when you submit.</p>
    </div>
  );
}
