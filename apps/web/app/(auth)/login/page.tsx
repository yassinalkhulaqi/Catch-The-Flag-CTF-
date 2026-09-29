import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";
import { Skeleton } from "@/components/ui/badge";

export const metadata = { title: "Log in" };

export default function LoginPage() {
  return (
    <Suspense fallback={<Skeleton className="h-64 w-full" />}>
      <LoginForm />
    </Suspense>
  );
}
