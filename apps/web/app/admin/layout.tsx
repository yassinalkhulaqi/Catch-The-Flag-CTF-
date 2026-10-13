import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { AdminNav } from "@/components/admin/admin-nav";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getCurrentUser } from "@/lib/api/server";

export const metadata: Metadata = { title: "Admin" };

/**
 * Admin console shell — deliberately separate from the `(app)` group so the
 * staff-only chrome (sidebar nav) and role gate live in one place.
 * Non-staff users hit the `app/admin/not-found.tsx` boundary (no existence
 * oracle, no data fetched); logged-out users go to login.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "admin" && user.role !== "moderator") notFound();

  return (
    <>
      <SiteHeader user={user} />
      <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        <p className="font-mono text-xs uppercase tracking-widest text-accent">
          Administration
        </p>
        <div className="mt-4 grid gap-6 lg:grid-cols-[200px_1fr]">
          <AdminNav />
          <main className="min-w-0">{children}</main>
        </div>
      </div>
      <SiteFooter />
    </>
  );
}
