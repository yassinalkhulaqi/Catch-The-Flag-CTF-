/**
 * PortSwigger-style academy tiers + vulnerability tracks.
 *
 * Presentation-only: the backend owns `difficulty` and `category.slug`.
 * This module only maps those values onto academy labels so the challenges
 * index can browse by tier (Apprentice / Practitioner / Expert) and by
 * vulnerability track. It never computes XP, progress, or solve status.
 */

import type { Difficulty } from "@/lib/types";

/* ---------- tiers ---------- */

export const TIERS = ["apprentice", "practitioner", "expert"] as const;

export type Tier = (typeof TIERS)[number];

export const TIER_LABELS: Record<Tier, string> = {
  apprentice: "Apprentice",
  practitioner: "Practitioner",
  expert: "Expert",
};

/**
 * Map API difficulty onto an academy tier.
 * beginner → Apprentice (emerald), intermediate → Practitioner (amber),
 * advanced | expert → Expert (crimson).
 */
export function tierFor(difficulty: Difficulty): Tier {
  switch (difficulty) {
    case "beginner":
      return "apprentice";
    case "intermediate":
      return "practitioner";
    case "advanced":
    case "expert":
      return "expert";
  }
}

export function isTier(value: unknown): value is Tier {
  return (
    typeof value === "string" &&
    (TIERS as readonly string[]).includes(value.toLowerCase())
  );
}

export function normalizeTier(value: unknown): Tier | null {
  if (typeof value !== "string") return null;
  const v = value.toLowerCase() as Tier;
  return isTier(v) ? v : null;
}

/* ---------- tracks ---------- */

export interface Track {
  slug: string;
  title: string;
  blurb: string;
  /** Category slugs (API `category.slug`) that belong to this track. */
  categorySlugs: string[];
  /** Tag slugs (API `tag.slug`) that resolve to this track before categories. */
  tagSlugs: string[];
}

export const TRACKS: Track[] = [
  {
    slug: "sql-injection",
    title: "SQL Injection",
    blurb: "Login bypasses, UNION exfiltration, and blind injection against static dumps.",
    categorySlugs: ["web"],
    tagSlugs: ["sql-injection", "sqli", "sql", "sqlmap", "union", "blind-sqli"],
  },
  {
    slug: "xss",
    title: "XSS",
    blurb: "Reflected, stored, and DOM cross-site scripting in captured pages and files.",
    categorySlugs: ["web"],
    tagSlugs: ["xss", "cross-site-scripting", "stored-xss", "reflected-xss", "dom-xss"],
  },
  {
    slug: "csrf",
    title: "CSRF",
    blurb: "Cross-site request forgery flows and missing-token patterns.",
    categorySlugs: ["web"],
    tagSlugs: ["csrf", "xsrf", "cross-site-request-forgery"],
  },
  {
    slug: "ssrf",
    title: "SSRF",
    blurb: "Server-side request forgery and internal-service reachability puzzles.",
    categorySlugs: ["web"],
    tagSlugs: ["ssrf", "server-side-request-forgery"],
  },
  {
    slug: "idor-access-control",
    title: "IDOR & Access Control",
    blurb: "Insecure direct object references and broken access-control checks.",
    categorySlugs: ["web"],
    tagSlugs: [
      "idor",
      "access-control",
      "broken-access-control",
      "insecure-direct-object-reference",
    ],
  },
  {
    slug: "authentication",
    title: "Authentication",
    blurb: "Login logic flaws, session handling, and password-reset weaknesses.",
    categorySlugs: ["web"],
    tagSlugs: [
      "authentication",
      "auth",
      "login",
      "session",
      "password",
      "2fa",
      "mfa",
      "brute-force",
    ],
  },
  {
    slug: "file-upload",
    title: "File Upload",
    blurb: "Unrestricted uploads, polyglots, and MIME-validation bypasses.",
    categorySlugs: ["web"],
    tagSlugs: ["file-upload", "upload", "unrestricted-upload"],
  },
  {
    slug: "command-injection",
    title: "Command Injection",
    blurb: "OS command injection, template injection, and file-inclusion chains.",
    categorySlugs: ["web"],
    tagSlugs: [
      "command-injection",
      "rce",
      "code-execution",
      "ssti",
      "lfi",
      "rfi",
      "path-traversal",
      "xxe",
    ],
  },
  {
    slug: "jwt-api",
    title: "JWT & API",
    blurb: "JWT confusion, OAuth misconfigurations, and REST/GraphQL abuse.",
    categorySlugs: ["web"],
    tagSlugs: ["jwt", "api", "json-web-token", "oauth", "graphql", "rest"],
  },
  {
    slug: "crypto",
    title: "Crypto",
    blurb: "Classical ciphers, RSA/AES misuse, hashes, and encoding puzzles.",
    categorySlugs: ["crypto", "cryptography"],
    tagSlugs: [
      "crypto",
      "cryptography",
      "rsa",
      "aes",
      "caesar",
      "cipher",
      "hash",
      "encoding",
      "decoding",
    ],
  },
  {
    slug: "forensics",
    title: "Forensics",
    blurb: "Disk and memory images, PCAP triage, OSINT trails, and hidden payloads.",
    categorySlugs: [
      "forensics",
      "digital-forensics",
      "dfir",
      "network",
      "network-forensics",
      "osint",
      "soc",
      "security-operations",
      "stego",
      "steganography",
    ],
    tagSlugs: [
      "forensics",
      "forensic",
      "dfir",
      "pcap",
      "wireshark",
      "volatility",
      "memory",
      "memory-forensics",
      "network-forensics",
      "osint",
      "osint-usernames",
      "steg",
      "steganography",
    ],
  },
  {
    slug: "misc",
    title: "Misc",
    blurb: "Trivia, reversing one-offs, pwn warm-ups, and everything in between.",
    categorySlugs: [
      "misc",
      "pwn",
      "reverse",
      "reverse-engineering",
      "re",
      "malware",
      "malware-analysis",
    ],
    tagSlugs: [
      "misc",
      "misc-trivia",
      "trivia",
      "general",
      "elf",
      "ghidra",
      "pwn",
      "reverse",
    ],
  },
];

function normalizeSlug(slug: string | null | undefined): string {
  return (slug ?? "").trim().toLowerCase();
}

function miscTrack(): Track {
  // Misc is always last in TRACKS; fall back defensively if reordered.
  return TRACKS.find((t) => t.slug === "misc") ?? TRACKS[TRACKS.length - 1];
}

/**
 * Resolve a category slug to its track. Web sub-tracks share the `web`
 * category, so this returns the first web track (SQL Injection) for `web` —
 * use `trackForChallenge` for tag-aware precision. Unknown slugs fall back
 * to Misc so the track browser never drops a challenge.
 */
export function trackForCategory(slug: string | null | undefined): Track {
  const normalized = normalizeSlug(slug);
  if (!normalized) return miscTrack();
  return TRACKS.find((t) => t.categorySlugs.includes(normalized)) ?? miscTrack();
}

/**
 * Tag-aware resolution: prefer a tag match, then fall back to the category.
 * Powers the track browser so a `web` challenge tagged `xss` lands in XSS.
 */
export function trackForChallenge(
  categorySlug: string | null | undefined,
  tagSlugs: Array<string | null | undefined> = [],
): Track {
  const normalizedTags = tagSlugs.map(normalizeSlug).filter(Boolean);
  for (const tag of normalizedTags) {
    const hit = TRACKS.find((t) => t.tagSlugs.includes(tag));
    if (hit) return hit;
  }
  return trackForCategory(categorySlug);
}
