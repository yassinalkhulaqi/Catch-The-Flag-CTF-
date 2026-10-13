import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "outline";
type Size = "sm" | "md" | "lg" | "icon";

const variants: Record<Variant, string> = {
  primary: "bg-accent text-accent-foreground hover:bg-accent-hover font-medium shadow-sm",
  secondary: "bg-surface-raised text-foreground hover:bg-border border border-border",
  ghost: "text-muted hover:text-foreground hover:bg-surface-raised",
  danger: "bg-danger text-danger-foreground hover:opacity-90",
  outline: "border border-border-strong text-foreground hover:bg-surface-raised",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-4 text-sm",
  lg: "h-11 px-6 text-sm",
  icon: "size-10",
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

export function buttonVariants(
  variant: Variant = "primary",
  size: Size = "md",
  className?: string,
): string {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-md transition-colors",
    "disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
    "whitespace-nowrap select-none",
    "active:translate-y-px motion-reduce:active:translate-y-0",
    variants[variant],
    sizes[size],
    className,
  );
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  type = "button",
  loading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonVariants(variant, size, className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <Spinner /> : null}
      {children}
    </button>
  );
}

function Spinner() {
  return (
    <span
      aria-hidden="true"
      className="size-3.5 animate-spin rounded-full border-2 border-current border-e-transparent motion-reduce:animate-none"
    />
  );
}
