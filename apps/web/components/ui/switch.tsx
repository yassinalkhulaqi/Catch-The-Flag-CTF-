"use client";

import { cn } from "@/lib/utils";

export function Switch({
  checked,
  onCheckedChange,
  label,
  disabled,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors",
        checked ? "border-accent bg-accent" : "border-border bg-surface-raised",
        "disabled:opacity-50",
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "inline-block size-4 rounded-full bg-background shadow-sm transition-transform duration-150 motion-reduce:transition-none",
          checked ? "translate-x-5 rtl:-translate-x-5" : "translate-x-1 rtl:-translate-x-1",
        )}
      />
    </button>
  );
}
