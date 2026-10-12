import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const DISCIPLINES = [
  {
    name: "SOC",
    blurb: "Triage alerts, correlate events, write the timeline that matters.",
  },
  {
    name: "Digital Forensics",
    blurb: "Disk, memory and artifact recovery — reconstruct what happened.",
  },
  {
    name: "Network Forensics",
    blurb: "PCAP deep dives: sessions, exfiltration, covert channels.",
  },
  {
    name: "Malware Analysis",
    blurb: "Static and dynamic triage of hostile samples, safely offline.",
  },
  {
    name: "Reverse Engineering",
    blurb: "Disassemble, understand, defeat the check — binaries and beyond.",
  },
  {
    name: "Cryptography",
    blurb: "Broken primitives, sloppy modes, nonce reuse, oracle leaks.",
  },
  {
    name: "OSINT",
    blurb: "Find what was never meant to be public, from public sources.",
  },
  {
    name: "Steganography",
    blurb: "Hidden payloads in images, audio and file metadata.",
  },
] as const;

const STEPS = [
  {
    title: "Choose a path",
    body: "Structured curricula from theory to practice — modules, lessons and quizzes in order.",
  },
  {
    title: "Study the lesson",
    body: "Concise, technical write-ups. No filler, no clickbait — the theory you actually need.",
  },
  {
    title: "Catch the flag",
    body: "Download the challenge files, analyse them offline, submit the flag. Hints cost points.",
  },
  {
    title: "Progress honestly",
    body: "XP, achievements, progress and leaderboard rank are computed server-side. Every time.",
  },
] as const;

export default function HomePage() {
  return (
    <>
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:py-28">
          <Badge tone="accent" className="mb-6">
            V1 · Static CTF + Learning Paths
          </Badge>

          <h1 className="max-w-3xl text-4xl font-semibold leading-tight tracking-tight text-foreground sm:text-5xl">
            Learn forensics, malware analysis and RE —{" "}
            <span className="text-accent">then catch the flag.</span>
          </h1>

          <p className="mt-5 max-w-2xl text-lg leading-8 text-muted">
            Catch The Flag is a cybersecurity training ground: structured
            learning paths paired with file-based CTF challenges across the
            disciplines a SOC analyst, DFIR practitioner or CTF player actually
            uses.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/register" className={buttonVariants("primary", "lg")}>
              Create an account
            </Link>
            <Link href="/paths" className={buttonVariants("outline", "lg")}>
              Browse paths
            </Link>
          </div>

          <dl className="mt-12 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-4">
            {[
              { term: "Disciplines", value: "8" },
              { term: "Format", value: "File-based" },
              { term: "Progression", value: "XP + ranks" },
              { term: "V1 scope", value: "No live labs" },
            ].map((item) => (
              <div key={item.term} className="bg-surface px-4 py-5">
                <dt className="font-mono text-[11px] uppercase tracking-wide text-faint">
                  {item.term}
                </dt>
                <dd className="mt-1 text-lg font-semibold text-foreground">
                  {item.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="border-b border-border" aria-labelledby="how-heading">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h2
            id="how-heading"
            className="font-mono text-xs uppercase tracking-widest text-accent"
          >
            How it works
          </h2>
          <p className="mt-3 max-w-2xl text-2xl font-semibold tracking-tight text-foreground">
            Theory, practice, proof — in that order.
          </p>

          <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, index) => (
              <li key={step.title}>
                <Card className="h-full">
                  <span className="font-mono text-xs text-faint">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <CardTitle className="mt-2 text-base">{step.title}</CardTitle>
                  <CardDescription className="mt-2 leading-6">
                    {step.body}
                  </CardDescription>
                </Card>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section aria-labelledby="disciplines-heading">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h2
            id="disciplines-heading"
            className="font-mono text-xs uppercase tracking-widest text-accent"
          >
            Disciplines
          </h2>
          <p className="mt-3 max-w-2xl text-2xl font-semibold tracking-tight text-foreground">
            Eight V1 categories, authored as data — never a code change.
          </p>

          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {DISCIPLINES.map((item) => (
              <li key={item.name}>
                <Card className="h-full">
                  <CardTitle>{item.name}</CardTitle>
                  <CardDescription className="mt-2 leading-6">
                    {item.blurb}
                  </CardDescription>
                </Card>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="border-t border-border" aria-labelledby="cta-heading">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-16 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2
              id="cta-heading"
              className="text-2xl font-semibold tracking-tight text-foreground"
            >
              Ready to start the first path?
            </h2>
            <p className="mt-2 max-w-xl text-muted">
              Create an account, pick a path and solve your first challenge.
              Everything you earn is tracked server-side.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-3">
            <Link href="/register" className={buttonVariants("primary")}>
              Get started
            </Link>
            <Link href="/about" className={cn(buttonVariants("ghost"), "text-muted")}>
              About the platform
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
