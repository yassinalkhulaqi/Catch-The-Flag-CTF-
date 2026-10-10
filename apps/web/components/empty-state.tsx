import { cn } from "@/lib/utils";

export function EmptyState({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-start gap-3 border border-dashed border-border px-5 py-10",
        className,
      )}
      role="status"
    >
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
      {description ? <p className="max-w-md text-sm text-muted">{description}</p> : null}
      {action}
    </div>
  );
}

export function ErrorState({
  title = "Unable to load",
  description = "Please try again in a moment.",
  className,
}: {
  title?: string;
  description?: string;
  className?: string;
}) {
  return (
    <div
      className={cn("border border-danger/30 bg-danger/5 px-5 py-6", className)}
      role="alert"
    >
      <h2 className="text-base font-semibold text-danger">{title}</h2>
      <p className="mt-1 text-sm text-muted">{description}</p>
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  transitionName = "ctf-title",
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  /** Shared element name for the View Transitions API. */
  transitionName?: string;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div className="space-y-2">
        {eyebrow ? (
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-accent">
            {eyebrow}
          </p>
        ) : null}
        <h1
          className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl"
          style={{ viewTransitionName: transitionName }}
        >
          {title}
        </h1>
        {description ? (
          <p className="max-w-2xl text-sm text-muted sm:text-base">{description}</p>
        ) : null}
      </div>
      {actions}
    </div>
  );
}
