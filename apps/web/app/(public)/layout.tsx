import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getCurrentUser } from "@/lib/api/server";

export default async function PublicLayout({
  children,
}: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  return (
    <>
      <SiteHeader user={user} />
      <main id="main" className="flex-1">{children}</main>
      <SiteFooter />
    </>
  );
}
