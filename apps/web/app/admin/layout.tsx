import { AdminNav } from "@/components/admin-nav";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { requireStaff } from "@/lib/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireStaff();

  return (
    <>
      <SiteHeader user={user} />
      <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        <div className="mb-4">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-accent">Admin</p>
          <h1 className="font-display text-2xl font-semibold">Content & operations</h1>
        </div>
        <AdminNav />
        <div className="py-6">{children}</div>
      </main>
      <SiteFooter />
    </>
  );
}
