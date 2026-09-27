import { redirect } from "next/navigation";
import { DashboardNav } from "@/components/dashboard-nav";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getCurrentUser } from "@/lib/api/server";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <>
      <SiteHeader user={user} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        <DashboardNav />
        <div className="py-6">{children}</div>
      </main>
      <SiteFooter />
    </>
  );
}
