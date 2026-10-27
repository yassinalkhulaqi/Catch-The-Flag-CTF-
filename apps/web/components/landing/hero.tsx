"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2, Flame, ShieldCheck, Terminal, Trophy } from "lucide-react";
import { AmbientGrid } from "@/lib/motion/ambient-grid";
import { Magnetic } from "@/lib/motion/magnetic";
import { Marquee } from "@/lib/motion/marquee";
import { Typewriter } from "@/lib/motion/typewriter";
import { buttonVariants } from "@/components/ui/button";
import { useDictionary } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const DISCIPLINES = [
  "DFIR",
  "Malware analysis",
  "Reverse engineering",
  "Cryptography",
  "OSINT",
  "Steganography",
  "Network forensics",
  "SOC operations",
];

const TERMINAL_LINES = [
  { prompt: "ctf", command: "path start dfir-essentials", muted: false },
  { output: "→ module 01 · evidence triage", muted: true },
  { output: "→ challenge · welcome-text-flag", muted: true },
  { prompt: "ctf", command: "submit flag{redacted}", muted: false },
  { output: "✓ correct · +50 XP · rank moved to #128", muted: false, success: true },
];

export function LandingHero({ signedIn }: { signedIn: boolean }) {
  const copy = useDictionary();

  return (
    <section className="relative overflow-hidden border-b border-border">
      <div aria-hidden="true" className="hero-grid absolute inset-0 opacity-60" />
      <AmbientGrid className="pointer-events-none absolute inset-0 opacity-60" />
      <div aria-hidden="true" className="aurora pointer-events-none absolute inset-0" />
      <div className="atmosphere relative mx-auto grid max-w-6xl gap-14 px-4 pb-16 pt-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-10 lg:pb-24 lg:pt-24">
        <div className="relative">
          <p className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.16em] text-accent">
            <span aria-hidden="true" className="size-1.5 rounded-full bg-accent animate-pulse-soft" />
            {copy.hero.eyebrow}
          </p>

          <h1 className="type-display mt-6 max-w-2xl text-balance text-foreground">
            Catch The <span className="text-gradient">Flag</span>
          </h1>

          <p className="mt-5 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
            Learn the case, hunt the artifact, and prove the solve. A deliberate-practice
            platform for defenders — with server-scored flags and no live targets to hide behind.
          </p>

          <Typewriter
            className="mt-4 max-w-xl font-mono text-xs text-accent/90 sm:text-sm"
            lines={[...copy.hero.lines]}
          />

          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Magnetic>
              <Link
                href={signedIn ? "/dashboard" : "/register"}
                className={cn(buttonVariants("primary", "lg"), "group gap-2")}
              >
                {signedIn ? copy.hero.continue : copy.hero.start}
                <ArrowRight
                  aria-hidden="true"
                  className="size-4 transition-transform duration-200 group-hover:translate-x-0.5"
                />
              </Link>
            </Magnetic>
            <Link
              href="/challenges"
              className={cn(buttonVariants("outline", "lg"), "gap-2")}
            >
              <Terminal aria-hidden="true" className="size-4" />
              {copy.hero.browse}
            </Link>
          </div>

          <ul className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted">
            {["No live machines", "Server-side XP", "Free to start"].map((item) => (
              <li key={item} className="inline-flex items-center gap-1.5">
                <CheckCircle2 aria-hidden="true" className="size-3.5 text-success" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative mx-auto w-full max-w-md lg:max-w-none">
          <div
            aria-hidden="true"
            className="absolute -inset-8 rounded-[2.5rem] bg-accent/10 blur-3xl"
          />
          <div className="terminal-window scanlines relative overflow-hidden rounded-2xl border border-border-strong/70">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div className="flex items-center gap-1.5" aria-hidden="true">
                <span className="size-2.5 rounded-full bg-danger/70" />
                <span className="size-2.5 rounded-full bg-warning/70" />
                <span className="size-2.5 rounded-full bg-success/70" />
              </div>
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-faint">
                ctf — zsh
              </span>
              <ShieldCheck aria-hidden="true" className="size-3.5 text-success/80" />
            </div>
            <div className="space-y-2 p-4 font-mono text-[11px] leading-relaxed sm:p-5 sm:text-xs">
              {TERMINAL_LINES.map((line, index) =>
                "prompt" in line ? (
                  <p key={index} className="flex gap-2">
                    <span className="text-accent">$</span>
                    <span className="text-muted">{line.prompt}</span>
                    <span className="text-foreground">{line.command}</span>
                  </p>
                ) : (
                  <p
                    key={index}
                    className={cn(
                      "ps-4",
                      line.success ? "text-success" : line.muted ? "text-faint" : "text-foreground",
                    )}
                  >
                    {line.output}
                  </p>
                ),
              )}
              <p className="flex gap-2 pt-1">
                <span className="text-accent">$</span>
                <span aria-hidden="true" className="caret" />
              </p>
            </div>
          </div>

          <div className="pointer-events-none absolute -end-4 top-10 hidden animate-float sm:block">
            <div className="rounded-xl border border-border bg-surface/90 p-3 shadow-lg backdrop-blur">
              <p className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wide text-faint">
                <Flame aria-hidden="true" className="size-3 text-warning" />
                Streak
              </p>
              <p className="mt-1 font-display text-lg font-semibold">7 days</p>
            </div>
          </div>

          <div className="pointer-events-none absolute -start-5 bottom-8 hidden animate-float-delayed sm:block">
            <div className="rounded-xl border border-border bg-surface/90 p-3 shadow-lg backdrop-blur">
              <p className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wide text-faint">
                <Trophy aria-hidden="true" className="size-3 text-accent" />
                Global rank
              </p>
              <p className="mt-1 font-display text-lg font-semibold">#128</p>
            </div>
          </div>
        </div>
      </div>

      <div className="relative border-t border-border/70 bg-background/50 py-3">
        <Marquee speed={30} className="mx-auto max-w-6xl px-4">
          {DISCIPLINES.map((discipline) => (
            <span key={discipline} className="flex items-center gap-3">
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-faint">
                {discipline}
              </span>
              <span aria-hidden="true" className="text-accent/50">
                //
              </span>
            </span>
          ))}
        </Marquee>
      </div>
    </section>
  );
}
