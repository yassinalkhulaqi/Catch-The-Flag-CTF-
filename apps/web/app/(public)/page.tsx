import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Catch The Flag",
  description: "Learn. Hunt. Capture. — cybersecurity learning paths and static CTF challenges.",
};

export default function LandingPage() {
  return (
    <div className="atmosphere relative overflow-hidden">
      <section className="relative mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-6xl flex-col justify-center px-4 py-16 sm:py-24">
        <div className="pointer-events-none absolute inset-y-10 right-[-10%] hidden w-[48%] lg:block" aria-hidden="true">
          <HeroMark />
        </div>

        <p className="animate-fade-up font-mono text-xs uppercase tracking-[0.28em] text-accent">
          CTF
        </p>

        <h1 className="animate-fade-up-delay mt-4 max-w-3xl font-display text-5xl font-semibold tracking-tight text-foreground sm:text-6xl lg:text-7xl">
          Catch The Flag
        </h1>

        <p className="animate-fade-up-delay-2 mt-5 max-w-xl text-lg text-muted sm:text-xl">
          Learn. Hunt. Capture.
        </p>

        <div className="animate-fade-up-delay-2 mt-10 flex flex-wrap gap-3">
          <Link href="/register" className={cn(buttonVariants("primary", "lg"))}>
            Get started
          </Link>
          <Link href="/challenges" className={cn(buttonVariants("outline", "lg"))}>
            Browse challenges
          </Link>
        </div>
      </section>

      <section className="border-t border-border bg-background/80">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 md:grid-cols-3">
          <Feature
            label="01"
            title="Structured paths"
            body="Theory → practice → challenge. Build DFIR, malware, RE, and crypto skills with a clear curriculum."
          />
          <Feature
            label="02"
            title="Static CTF challenges"
            body="Download files, analyze artifacts, unlock hints, and submit flags — no live lab risk in V1."
          />
          <Feature
            label="03"
            title="Honest progression"
            body="XP, solves, achievements, and a deterministic leaderboard computed server-side."
          />
        </div>
      </section>
    </div>
  );
}

function Feature({
  label,
  title,
  body,
}: {
  label: string;
  title: string;
  body: string;
}) {
  return (
    <div>
      <p className="font-mono text-xs text-accent">{label}</p>
      <h2 className="mt-2 font-display text-xl font-semibold text-foreground">{title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted">{body}</p>
    </div>
  );
}

function HeroMark() {
  return (
    <svg
      viewBox="0 0 320 360"
      className="animate-flag-draw h-full w-full text-border-strong opacity-70"
      fill="none"
    >
      <path d="M72 24v312" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path
        d="M72 48h168l-36 54 36 54H78"
        stroke="var(--accent)"
        strokeWidth="3"
        strokeLinejoin="round"
        fill="color-mix(in srgb, var(--accent) 12%, transparent)"
      />
      <path d="M40 336h220" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
