import { Lock, Server, ShieldCheck, Zap } from "lucide-react";
import { SectionHeading } from "@/components/landing/section-heading";
import { Reveal } from "@/lib/motion/reveal";

const GUARANTEES = [
  {
    icon: ShieldCheck,
    title: "Flags never leave the server",
    body: "Encrypted at rest, compared with constant-time hashing, and never returned by any endpoint.",
  },
  {
    icon: Server,
    title: "XP is server-authoritative",
    body: "Correct flags write a solve and a ledger row. Refreshing the page cannot invent progress.",
  },
  {
    icon: Lock,
    title: "Files are treated as hostile",
    body: "No uploaded file executes. Downloads stream through a policy-checked endpoint only.",
  },
  {
    icon: Zap,
    title: "Fast by default",
    body: "Reduced motion is respected, heavy effects pause off-screen, and the layout stays keyboard-first.",
  },
];

export function Guarantees() {
  return (
    <section className="border-t border-border bg-surface/30" aria-labelledby="guarantees-heading">
      <div className="mx-auto max-w-6xl px-4 py-16 lg:py-20">
        <SectionHeading
          id="guarantees-heading"
          eyebrow="// Guarantees"
          title="Built like a platform, not a demo"
          description="The same rules apply to every account: server checks, audited writes, and no short cuts."
        />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {GUARANTEES.map((item, index) => (
            <Reveal key={item.title} delay={index * 60}>
              <div className="h-full rounded-2xl border border-border bg-background/60 p-5 transition-colors hover:border-border-strong">
                <span className="inline-flex size-9 items-center justify-center rounded-lg border border-border bg-surface text-accent">
                  <item.icon aria-hidden="true" className="size-4" />
                </span>
                <h3 className="mt-4 text-sm font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{item.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
