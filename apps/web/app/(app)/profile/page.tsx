import { PageHeader } from "@/components/empty-state";
import { ProfileForm } from "@/components/profile-form";
import { requireUser } from "@/lib/auth";
import { formatXp } from "@/lib/utils";

export const metadata = { title: "Profile" };

export default async function ProfilePage() {
  const user = await requireUser();
  return (
    <div>
      <PageHeader
        eyebrow="Account"
        title="Profile"
        description={`${formatXp(user.xp)} XP · ${user.solved_count} solves · role ${user.role}`}
      />
      <ProfileForm user={user} />
    </div>
  );
}
