import { cn } from "@/lib/utils";

export function Avatar({
  name,
  src,
  className,
}: {
  name: string;
  src?: string | null;
  className?: string;
}) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  if (src) {
    return (
      // Remote avatars stay as img until the storage host is allowlisted for next/image.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt=""
        width={40}
        height={40}
        className={cn("size-10 rounded-full border border-border object-cover", className)}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex size-10 items-center justify-center rounded-full border border-border bg-surface-raised font-mono text-xs text-accent",
        className,
      )}
    >
      {initials || "CTF"}
    </span>
  );
}
