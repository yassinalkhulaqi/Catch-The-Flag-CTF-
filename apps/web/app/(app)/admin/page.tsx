import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/api/server";

export const metadata: Metadata = { title: "Admin" };

const SECTIONS = [
  { href: "/admin/challenges", title: "Challenges", body: "Author, publish and archive challenges." },
  { href: "/admin/paths", title: "Paths", body: "Curricula, modules and lessons." },
  { href: "/admin/users", title: "Users", body: "Roles and moderation." },
] as const;

export default async function AdminPage() {
  const user = await getCurrentUser();

  if (!user || user.role === "user") {
    return (
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Admin
        </h1>
        <Card className="mt-6">
          <CardTitle>Restricted area</CardTitle>
          <CardDescription className="mt-2">
            Moderator or admin role required. Every admin action is audit
            logged.
          </CardDescription>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
        Admin
      </h1>
      <p className="mt-1 text-muted">Authoring and moderation workflow.</p>
      <ul className="mt-6 grid gap-4 sm:grid-cols-3">
        {SECTIONS.map((s) => (
          <li key={s.href}>
            <Card className="h-full">
              <CardTitle>
                <Link href={s.href} className="hover:text-accent">
                  {s.title}
                </Link>
              </CardTitle>
              <CardDescription className="mt-2">{s.body}</CardDescription>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}
