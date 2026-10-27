import { Flag, Layers, Users } from "lucide-react";
import { CountUp } from "@/lib/motion/count-up";
import { Reveal } from "@/lib/motion/reveal";

export function CatalogStats({
  paths,
  challenges,
  players,
}: {
  paths: number;
  challenges: number;
  players: number;
}) {
  const items = [
    {
      label: "Published paths",
      value: paths,
      icon: Layers,
      detail: "Theory to linked practice",
    },
    {
      label: "Published challenges",
      value: challenges,
      icon: Flag,
      detail: "Static artifacts and files",
    },
    {
      label: "Ranked players",
      value: players,
      icon: Users,
      detail: "Deterministic XP ranking",
    },
  ];
  return (
    <section aria-label="Catalog totals" className="border-t border-border bg-surface/30">
      <dl className="mx-auto grid max-w-6xl gap-3 px-4 py-10 sm:grid-cols-3">
        {items.map((item, index) => (
          <Reveal key={item.label} delay={index * 70}>
            <div className="group relative overflow-hidden rounded-2xl border border-border bg-background/60 p-6 transition-colors hover:border-border-strong">
              <div
                aria-hidden="true"
                className="absolute -end-8 -top-8 size-28 rounded-full bg-accent/10 blur-2xl transition-opacity group-hover:opacity-100"
              />
              <item.icon aria-hidden="true" className="size-4 text-accent" />
              <dt className="mt-4 font-mono text-[10px] uppercase tracking-[0.18em] text-faint">
                {item.label}
              </dt>
              <dd className="mt-1 font-display text-4xl font-semibold tabular-nums">
                <CountUp value={item.value} />
              </dd>
              <p className="mt-2 text-xs text-muted">{item.detail}</p>
            </div>
          </Reveal>
        ))}
      </dl>
    </section>
  );
}
