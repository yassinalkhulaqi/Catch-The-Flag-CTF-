import Link from "next/link";
import { Logo } from "@/components/logo";

const COLUMNS = [
  {
    title: "Learn",
    links: [
      { href: "/paths", label: "Learning paths" },
      { href: "/challenges", label: "Challenge library" },
      { href: "/tools", label: "Toolbox" },
    ],
  },
  {
    title: "Compete",
    links: [
      { href: "/leaderboard", label: "Leaderboard" },
      { href: "/achievements", label: "Achievements" },
      { href: "/solves", label: "Solve log" },
    ],
  },
  {
    title: "Platform",
    links: [
      { href: "/about", label: "About" },
      { href: "/dashboard", label: "Dashboard" },
      { href: "/register", label: "Create account" },
    ],
  },
] as const;

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border bg-surface/30">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.7fr_1fr_1fr_1fr]">
          <div className="max-w-xs space-y-4">
            <Logo />
            <p className="text-sm leading-relaxed text-muted">
              Structured cybersecurity learning paths and file-based CTF challenges. Theory,
              practice, and a solve log that proves it.
            </p>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface-raised/60 px-2.5 py-1 font-mono text-[11px] uppercase tracking-wide text-muted">
              <span aria-hidden="true" className="size-1.5 rounded-full bg-success animate-pulse-soft" />
              All systems operational
            </span>
          </div>

          {COLUMNS.map((column) => (
            <nav key={column.title} aria-label={column.title} className="space-y-3">
              <h2 className="font-mono text-[11px] uppercase tracking-[0.18em] text-faint">
                {column.title}
              </h2>
              <ul className="space-y-2">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-border pt-6 text-xs text-faint sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Catch The Flag. Built for deliberate practice.</p>
          <p className="font-mono uppercase tracking-wide">
            Static challenges only · No live targets · V1
          </p>
        </div>
      </div>
    </footer>
  );
}
