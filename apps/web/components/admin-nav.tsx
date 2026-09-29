"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/admin", label: "Overview", exact: true },
  { href: "/admin/challenges", label: "Challenges" },
  { href: "/admin/paths", label: "Paths" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/tags", label: "Tags" },
  { href: "/admin/achievements", label: "Achievements" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/audit-logs", label: "Audit logs" },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav
      className="flex gap-1 overflow-x-auto border-b border-border"
      aria-label="Admin sections"
    >
      {LINKS.map((link) => {
        const active = link.exact
          ? pathname === link.href
          : pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "border-b-2 px-3 py-2 text-sm whitespace-nowrap",
              active
                ? "border-accent text-foreground"
                : "border-transparent text-muted hover:text-foreground",
            )}
            aria-current={active ? "page" : undefined}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
