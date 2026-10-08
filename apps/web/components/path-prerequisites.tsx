import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export function PathPrerequisites({
  items,
}: {
  items: Array<{ id: number; title: string; slug: string; completed: boolean }>;
}) {
  if (items.length === 0) return null;

  return (
    <section className="mb-10" aria-labelledby="prerequisites-heading">
      <h2
        id="prerequisites-heading"
        className="mb-3 font-mono text-xs uppercase tracking-[0.16em] text-accent"
      >
        Required first
      </h2>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.id} className="flex items-center justify-between gap-3 border border-border bg-surface px-4 py-3">
            <Link href={`/paths/${item.slug}`} className="font-medium text-foreground hover:text-accent">
              {item.title}
            </Link>
            {item.completed ? <Badge tone="success">Completed</Badge> : <Badge>Required</Badge>}
          </li>
        ))}
      </ul>
    </section>
  );
}
