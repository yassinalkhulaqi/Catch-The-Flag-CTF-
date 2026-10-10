import Link from "next/link";
import { PageHeader } from "@/components/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { dictionaryFor } from "@/lib/i18n/dictionary";
import { getLocale } from "@/lib/theme/locale";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "About",
  description:
    "Catch The Flag is a professional training ground for SOC analysts, DFIR practitioners, and CTF players — structured learning paths plus static, file-based challenges.",
};

export default async function AboutPage() {
  const copy = dictionaryFor(await getLocale());
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <PageHeader
        eyebrow="Catch The Flag"
        title={copy.pages.aboutTitle}
        description={copy.pages.aboutBody}
      />

      <div className="space-y-6 text-sm leading-relaxed text-muted">
        <p>
          Catch The Flag combines structured learning paths with static, file-based CTF
          challenges. Study a lesson, practice on artifacts, submit flags, earn XP, and climb
          a deterministic leaderboard.
        </p>
        <p>
          V1 deliberately excludes live machines, VPN labs, and browser shells. That keeps
          the platform secure, scalable, and focused on the disciplines that dominate real
          CTF competitions: forensics, malware analysis, reverse engineering, cryptography,
          OSINT, and steganography.
        </p>
        <p>
          Progression is honest — XP, solve status, and permissions are computed only on the
          server. Flags are never revealed through the API.
        </p>
      </div>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link href="/paths" className={cn(buttonVariants("primary"))}>
          Explore paths
        </Link>
        <Link href="/challenges" className={cn(buttonVariants("outline"))}>
          Browse challenges
        </Link>
      </div>
    </div>
  );
}
