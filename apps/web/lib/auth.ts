import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/api/server";
import type { CurrentUser, Role } from "@/lib/types";

const STAFF: Role[] = ["admin", "moderator"];

/** Require a logged-in user or redirect to login. */
export async function requireUser(
  redirectTo = "/login",
): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect(redirectTo);
  return user;
}

/** Require admin or moderator role. */
export async function requireStaff(): Promise<CurrentUser> {
  const user = await requireUser();
  if (!STAFF.includes(user.role)) redirect("/dashboard");
  return user;
}

export function isStaff(user: CurrentUser | null | undefined): boolean {
  return !!user && STAFF.includes(user.role);
}

export function isAdmin(user: CurrentUser | null | undefined): boolean {
  return user?.role === "admin";
}
