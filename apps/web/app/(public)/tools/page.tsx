import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = {
  title: "Security Tools | Catch The Flag",
  description:
    "Offline study aids for cybersecurity learners: encoder/decoder, payload cheatsheet, and a simulated request sandbox. No real requests leave the browser.",
};

const TOOLS = [
  {
    href: "/tools/decoder",
    title: "Encoder / decoder",
    description: "URL, Base64, hex, HTML, and unverified JWT inspection — all computed locally.",
    badge: "Offline",
  },
  {
    href: "/tools/cheatsheets",
    title: "Payload cheatsheet",
    description: "Searchable study reference for classic SQLi, XSS, SSRF, and path-traversal patterns.",
    badge: "Reference",
  },
  {
    href: "/tools/sandbox",
    title: "Request sandbox",
    description: "Shape HTTP requests and preview a canned simulated response. Nothing is ever sent.",
    badge: "Simulated",
  },
];

export default function ToolsHubPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <p className="type-eyebrow text-accent">Study aids</p>
      <h1 className="type-title mt-2">Security tools</h1>
      <p className="mt-2 max-w-2xl text-muted">
        Offline helpers for lessons and static challenges. Everything runs in your browser — no accounts,
        no lab machines, no network calls.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TOOLS.map((tool) => (
          <Link key={tool.href} href={tool.href} className="group focus-visible:outline-none">
            <Card className="h-full transition-colors group-hover:border-accent group-focus-visible:border-accent">
              <CardHeader>
                <CardTitle>{tool.title}</CardTitle>
                <Badge tone="neutral">{tool.badge}</Badge>
              </CardHeader>
              <CardDescription>{tool.description}</CardDescription>
              <span className="mt-4 inline-block text-sm text-accent">Open tool →</span>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
