import type { Metadata } from "next";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <p className="font-mono text-xs uppercase tracking-widest text-accent">
        About
      </p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
        A training ground for defenders
      </h1>
      <p className="mt-4 leading-7 text-muted">
        Catch The Flag pairs structured learning paths — theory, lessons,
        quizzes — with file-based CTF challenges across eight disciplines:
        SOC, digital forensics, network forensics, malware analysis, reverse
        engineering, cryptography, OSINT and steganography.
      </p>
      <p className="mt-4 leading-7 text-muted">
        Download the challenge files, analyse them offline, submit the flag.
        Hints cost points. XP, progress and leaderboard rank are computed
        server-side, every time.
      </p>
      <p className="mt-4 leading-7 text-muted">
        V1 is intentionally static: no live machines, no VPN labs, no
        browser shells. Realism comes from the artifacts, not infrastructure.
      </p>
    </div>
  );
}
