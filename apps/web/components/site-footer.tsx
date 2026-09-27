import Link from "next/link";
import { Logo } from "@/components/logo";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Logo />
          <span className="text-xs text-faint">Cybersecurity learning + CTF</span>
        </div>
        <nav className="flex flex-wrap gap-x-5 gap-y-2" aria-label="Footer">
          <Link href="/challenges" className="hover:text-foreground">Challenges</Link>
          <Link href="/paths" className="hover:text-foreground">Paths</Link>
          <Link href="/leaderboard" className="hover:text-foreground">Leaderboard</Link>
          <Link href="/about" className="hover:text-foreground">About</Link>
        </nav>
      </div>
    </footer>
  );
}
