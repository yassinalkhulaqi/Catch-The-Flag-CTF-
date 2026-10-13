"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/dashboard", label: "Overview" },
  { href: "/progress", label: "My Progress" },
  { href: "/solves", label: "My Solves" },
  { href: "/achievements", label: "Achievements" },
  { href: "/notifications", label: "Notifications" },
  { href: "/profile", label: "Profile" },
  { href: "/settings", label: "Settings" },
];

export function DashboardNav() {
  const pathname = usePathname();
  return (
    <nav
      className="flex gap-1 overflow-x-auto border-b border-border"
      aria-label="Account sections"
    >
      {TABS.map((tab) => {
        const active =
          pathname === tab.href || pathname.startsWith(`${tab.href}/`);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "border-b-2 px-3 py-2 text-sm whitespace-nowrap",
              active
                ? "border-accent text-foreground"
                : "border-transparent text-muted hover:text-foreground",
            )}
            aria-current={active ? "page" : undefined}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
