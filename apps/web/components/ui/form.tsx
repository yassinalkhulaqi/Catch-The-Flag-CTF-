import * as React from "react";
import { Field, control } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/**
 * Shared form shell. Client validation is a UX affordance only — Laravel
 * FormRequests remain the source of truth (docs/development.md §5).
 */
export function Form({
  label,
  pending,
  className,
  children,
  noValidate = true,
  ...props
}: React.FormHTMLAttributes<HTMLFormElement> & {
  label: string;
  pending?: boolean;
}) {
  return (
    <form
      noValidate={noValidate}
      aria-label={label}
      aria-busy={pending || undefined}
      className={cn("space-y-4", className)}
      {...props}
    >
      {children}
    </form>
  );
}

/** Consistent form-level failure region (replaces ad-hoc <p role="alert"> copies). */
export function FormError({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  if (!children) return null;
  return (
    <p role="alert" className={cn("text-sm text-danger", className)} {...props}>
      {children}
    </p>
  );
}

/** Consistent form-level success region. */
export function FormSuccess({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  if (!children) return null;
  return (
    <p role="status" className={cn("text-sm text-success", className)} {...props}>
      {children}
    </p>
  );
}

/**
 * The one styled native select. All forms use this instead of repeating
 * ad-hoc selectClass strings; the custom listbox stays for non-form UI.
 */
export function SelectField({
  id,
  label,
  options,
  error,
  hint,
  className,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & {
  id: string;
  label: string;
  options: ReadonlyArray<{ value: string; label: string }>;
  error?: string;
  hint?: string;
}) {
  return (
    <Field label={label} htmlFor={id} error={error} hint={hint}>
      <select
        id={id}
        className={cn(control, "h-10 cursor-pointer py-2", className)}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </Field>
  );
}
