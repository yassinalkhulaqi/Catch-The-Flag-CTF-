import Link from "next/link";
import {
  ArrowUpRight,
  Binary,
  BookMarked,
  Send,
  ShieldCheck,
  WifiOff,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const metadata = {
  title: "Security Tools | Catch The Flag",
  description:
    "Offline study aids for cybersecurity learners: encoder/decoder, payload cheatsheet, and a simulated request sandbox. No real requests leave the browser.",
};

const TOOLS: Array<{
  href: string;
  title: string;
  description: string;
  badge: string;
  icon: LucideIcon;
}> = [
  {
    href: "/tools/decoder",
    title: "Encoder / decoder",
    description: "URL, Base64, hex, HTML, and unverified JWT inspection — all computed locally.",
    badge: "Offline",
    icon: Binary,
  },
  {
    href: "/tools/cheatsheets",
    title: "Payload cheatsheet",
    description: "Searchable study reference for classic SQLi, XSS, SSRF, and path-traversal patterns.",
    badge: "Reference",
    icon: BookMarked,
  },
  {
    href: "/tools/sandbox",
    title: "Request sandbox",
    description: "Shape HTTP requests and preview a canned simulated response. Nothing is ever sent.",
    badge: "Simulated",
    icon: Send,
  },
];

export default function ToolsHubPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <section className="relative overflow-hidden rounded-2xl border border-border bg-surface/60 p-6 sm:p-8">
        <div aria-hidden="true" className="aurora pointer-events-none absolute inset-0 opacity-60" />
        <div className="relative">
          <p className="type-eyebrow text-accent">Study aids</p>
          <h1 className="type-title mt-2">Security tools</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
            Offline helpers for lessons and static challenges. Everything runs in your browser
            — no accounts, no lab machines, no network calls.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Badge tone="neutral">
              <WifiOff aria-hidden="true" className="size-3" />
              0 network calls
            </Badge>
            <Badge tone="success">
              <ShieldCheck aria-hidden="true" className="size-3" />
              Local only
            </Badge>
            <Badge tone="accent">{TOOLS.length} tools</Badge>
          </div>
        </div>
      </section>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TOOLS.map((tool) => {
          const Icon = tool.icon;
          return (
            <Link
              key={tool.href}
              href={tool.href}
              className="group flex h-full flex-col rounded-2xl border border-border bg-surface p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-accent/30 hover:shadow-[var(--shadow-float)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="inline-flex size-10 items-center justify-center rounded-xl border border-border bg-surface-raised text-accent">
                  <Icon aria-hidden="true" className="size-5" />
                </span>
                <ArrowUpRight
                  aria-hidden="true"
                  className="size-4 text-faint transition-colors group-hover:text-accent"
                />
              </div>
              <h2 className="mt-4 text-lg font-semibold text-foreground transition-colors group-hover:text-accent">
                {tool.title}
              </h2>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{tool.description}</p>
              <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                <Badge tone="neutral" className="normal-case">
                  {tool.badge}
                </Badge>
                <span className="inline-flex items-center gap-1 text-xs text-accent">
                  Open tool
                  <ArrowUpRight aria-hidden="true" className="size-3" />
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      <p className="mt-6 rounded-xl border border-border bg-surface/50 px-4 py-3 text-xs text-muted">
        These tools never execute payloads and never contact a target. Treat the output as
        study material for the static challenges.
      </p>
    </div>
  );
}
