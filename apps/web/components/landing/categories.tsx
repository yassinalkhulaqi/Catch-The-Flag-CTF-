import Link from "next/link";
import { ArrowUpRight, Flag } from "lucide-react";
import { SectionHeading } from "@/components/landing/section-heading";
import { CATEGORY_FALLBACKS } from "@/lib/design/category";
import { Reveal } from "@/lib/motion/reveal";
import { TiltCard } from "@/lib/motion/tilt";
import type { Category } from "@/lib/types";

function tokenFor(slug: string): string {
  if (slug.includes("forensic") && slug.includes("network")) return "network";
  if (slug.includes("forensic") || slug === "dfir") return "dfir";
  if (slug.includes("malware")) return "malware";
  if (slug.includes("reverse") || slug === "re") return "re";
  if (slug.includes("crypto")) return "crypto";
  if (slug.includes("osint")) return "osint";
  if (slug.includes("steg")) return "stego";
  if (slug.includes("soc")) return "soc";
  return "soc";
}

export function CategoryShowcase({ categories }: { categories: Category[] }) {
  const items = categories.length
    ? categories.map((category) => ({
        slug: category.slug,
        label: category.name,
        detail: category.description ?? "Published challenges in this discipline.",
        color: category.color,
        count: category.challenge_count,
      }))
    : CATEGORY_FALLBACKS.map((category) => ({
        slug: category.slug,
        label: category.label,
        detail: "Seeded discipline. Counts appear when the catalog loads.",
        color: null as string | null,
        count: undefined as number | undefined,
      }));

  return (
    <section className="border-t border-border" aria-labelledby="disciplines-heading">
      <div className="mx-auto max-w-6xl px-4 py-16 lg:py-20">
        <SectionHeading
          id="disciplines-heading"
          eyebrow="// Disciplines"
          title="Eight starting points. One deliberate practice loop."
          description="Every category is data, not a code change. Pick the discipline that matches the case in front of you."
          href="/challenges"
          linkLabel="Open the catalog"
        />
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item, index) => (
            <Reveal key={item.slug} as="li" delay={Math.min(index * 45, 240)}>
              <TiltCard className="h-full">
                <Link
                  href={`/challenges?category=${item.slug}`}
                  className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-surface p-5 transition-colors hover:border-border-strong"
                >
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 top-0 h-0.5 opacity-70 transition-opacity group-hover:opacity-100"
                    style={{
                      background: item.color ?? `var(--category-${tokenFor(item.slug)}, var(--accent))`,
                    }}
                  />
                  <div className="flex items-start justify-between gap-3">
                    <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-faint">
                      {item.slug.replaceAll("-", " ")}
                    </span>
                    <ArrowUpRight
                      aria-hidden="true"
                      className="size-3.5 text-faint transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent"
                    />
                  </div>
                  <span className="mt-5 block font-semibold">{item.label}</span>
                  <span className="mt-1 line-clamp-2 flex-1 text-sm leading-relaxed text-muted">
                    {item.detail}
                  </span>
                  {item.count !== undefined ? (
                    <span className="mt-4 inline-flex w-fit items-center gap-1.5 rounded-full border border-border bg-background/60 px-2 py-0.5 font-mono text-[10px] text-muted">
                      <Flag aria-hidden="true" className="size-3 text-accent" />
                      {item.count} challenges
                    </span>
                  ) : null}
                </Link>
              </TiltCard>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
