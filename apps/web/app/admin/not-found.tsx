import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

/** Rendered for non-staff users (and unknown admin routes). */
export default function AdminNotFound() {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
        Restricted area
      </h1>
      <Card className="mt-6">
        <CardTitle>Moderator or admin role required</CardTitle>
        <CardDescription className="mt-2">
          This section is not available for your account. Every admin action
          is audit logged.
        </CardDescription>
        <Link href="/dashboard" className={buttonVariants("outline", "sm")}>
          Back to dashboard
        </Link>
      </Card>
    </div>
  );
}
