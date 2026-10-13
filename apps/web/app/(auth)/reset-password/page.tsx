import type { Metadata } from "next";
import Link from "next/link";
import { ResetPasswordForm } from "@/components/reset-password-form";

export const metadata: Metadata = { title: "Reset password" };

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; email?: string }>;
}) {
  const { token, email } = await searchParams;

  if (!token || !email) {
    return (
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Invalid reset link
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted">
          This link is missing its token. Request a fresh one to continue.
        </p>
        <Link
          href="/forgot-password"
          className="mt-6 inline-block text-sm text-accent hover:underline"
        >
          Request a new link
        </Link>
      </div>
    );
  }

  return <ResetPasswordForm token={token} email={email} />;
}
