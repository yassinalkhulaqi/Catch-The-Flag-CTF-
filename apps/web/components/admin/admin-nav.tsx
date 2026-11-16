"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/admin", label: "Dashboard", exact: true },
  { href: "/admin/review-queue", label: "Review queue", exact: false },
  { href: "/admin/analytics", label: "Analytics", exact: false },
  { href: "/admin/challenges", label: "Challenges", exact: false },
  { href: "/admin/paths", label: "Paths", exact: false },
  { href: "/admin/users", label: "Users", exact: false },
  { href: "/admin/audit-log", label: "Audit Log", exact: false },
];

/** Admin sidebar nav. Client island (active-route highlighting only). */
export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Admin sections">
      <ul className="flex gap-1 overflow-x-auto border-b border-border pb-2 lg:flex-col lg:border-b-0 lg:pb-0">
        {ITEMS.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "block rounded-md px-3 py-2 text-sm whitespace-nowrap",
                  active
                    ? "bg-surface-raised text-foreground"
                    : "text-muted hover:bg-surface-raised hover:text-foreground",
                )}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
