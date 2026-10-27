import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export function SectionHeading({
  id,
  eyebrow,
  title,
  description,
  href,
  linkLabel,
}: {
  id?: string;
  eyebrow: string;
  title: string;
  description?: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl">
        <p className="type-eyebrow text-accent">{eyebrow}</p>
        <h2 id={id} className="type-title mt-2 text-balance">
          {title}
        </h2>
        {description ? <p className="mt-3 text-muted">{description}</p> : null}
      </div>
      {href && linkLabel ? (
        <Link
          href={href}
          className="hover-arrow inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-accent transition-colors hover:text-accent-hover"
        >
          {linkLabel}
          <ArrowUpRight aria-hidden="true" className="hover-arrow-icon size-4" />
        </Link>
      ) : null}
    </div>
  );
}
