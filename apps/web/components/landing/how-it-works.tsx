import { BookOpen, CheckCircle2, Terminal, Trophy } from "lucide-react";
import { SectionHeading } from "@/components/landing/section-heading";
import { Reveal } from "@/lib/motion/reveal";
import { SpotlightCard } from "@/lib/motion/spotlight";

const STEPS = [
  {
    label: "01",
    icon: BookOpen,
    title: "Follow a path",
    body: "Theory, then a lesson you mark complete, then a linked challenge. Prerequisites are checked by the server before a path will start.",
    detail: "Structured, not scattered",
  },
  {
    label: "02",
    icon: Terminal,
    title: "Hunt static CTFs",
    body: "Download the artifact, work offline, unlock hints if you want to spend points, and submit a flag. No live machines in this version.",
    detail: "Files are attachments",
  },
  {
    label: "03",
    icon: Trophy,
    title: "Earn honest XP",
    body: "A correct flag writes a solve, an XP ledger row, and your rank. Refreshing the page cannot invent points.",
    detail: "Server-authoritative",
  },
];

export function HowItWorks() {
  return (
    <section className="relative border-t border-border" aria-labelledby="how-heading">
      <div className="mx-auto max-w-6xl px-4 py-16 lg:py-20">
        <SectionHeading
          id="how-heading"
          eyebrow="// Method"
          title="A training loop that respects the work"
          description="Built for SOC analysts, DFIR practitioners, and CTF players who want the reasoning to matter — calm on purpose, never a slot machine."
          href="/about"
          linkLabel="Read the approach"
        />
        <div className="relative grid gap-4 md:grid-cols-3">
          <div
            aria-hidden="true"
            className="absolute inset-x-8 top-9 hidden h-px bg-gradient-to-r from-transparent via-border-strong to-transparent md:block"
          />
          {STEPS.map((step, index) => (
            <Reveal key={step.label} delay={index * 90}>
              <SpotlightCard className="group h-full p-5 transition-colors hover:border-border-strong">
                <div className="flex items-center justify-between gap-3">
                  <span className="inline-flex size-10 items-center justify-center rounded-xl border border-accent/25 bg-accent/10 text-accent">
                    <step.icon aria-hidden="true" className="size-[18px]" />
                  </span>
                  <span className="font-mono text-xs text-faint">{step.label}</span>
                </div>
                <h3 className="mt-5 text-xl font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{step.body}</p>
                <p className="mt-5 flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wide text-muted">
                  <CheckCircle2 aria-hidden="true" className="size-3.5 text-success" />
                  {step.detail}
                </p>
              </SpotlightCard>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
