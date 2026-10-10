import Link from "next/link";
import { LandingHero } from "@/components/landing/hero";
import {
  CatalogStats,
  CategoryShowcase,
  FeaturedChallenges,
  FeaturedPaths,
  HowItWorks,
  LeaderboardPreview,
} from "@/components/landing/sections";
import { buttonVariants } from "@/components/ui/button";
import { getCurrentUser, serverApi } from "@/lib/api/server";
import { cn } from "@/lib/utils";
import type {
  Category,
  ChallengeSummary,
  LeaderboardEntry,
  Paginated,
  PathSummary,
} from "@/lib/types";

export const metadata = {
  title: "Catch The Flag",
  description: "Learn. Hunt. Capture. — cybersecurity learning paths and static CTF challenges.",
};

export default async function LandingPage() {
  const user = await getCurrentUser();
  let paths: PathSummary[] = [];
  let pathTotal = 0;
  let challenges: ChallengeSummary[] = [];
  let challengeTotal = 0;
  let categories: Category[] = [];
  let leaders: LeaderboardEntry[] = [];
  let playerTotal = 0;

  try {
    const [pathRes, challengeRes, categoryRes, boardRes] = await Promise.all([
      serverApi<Paginated<PathSummary>>("GET", "/paths?per_page=3"),
      serverApi<Paginated<ChallengeSummary>>("GET", "/challenges?per_page=5"),
      serverApi<{ data: Category[] }>("GET", "/categories"),
      serverApi<Paginated<LeaderboardEntry>>("GET", "/leaderboard?per_page=3"),
    ]);
    paths = pathRes.data;
    pathTotal = pathRes.meta.total;
    challenges = challengeRes.data;
    challengeTotal = challengeRes.meta.total;
    categories = categoryRes.data;
    leaders = boardRes.data;
    playerTotal = boardRes.meta.total;
  } catch {
    /* Featured sections explain themselves when the API is down. */
  }

  return (
    <div>
      <LandingHero signedIn={!!user} />
      <CatalogStats paths={pathTotal} challenges={challengeTotal} players={playerTotal} />
      <HowItWorks />
      <CategoryShowcase categories={categories} />
      <FeaturedPaths paths={paths} />
      <FeaturedChallenges challenges={challenges} />
      <LeaderboardPreview entries={leaders} />
      <section className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-4 px-4 py-16">
          <h2 className="type-title">Start with a path, or go straight to a challenge.</h2>
          <p className="max-w-xl text-muted">
            Files stay attachments. Flags stay on the server. Your rank moves only when a solve is recorded.
          </p>
          <Link href={user ? "/dashboard" : "/register"} className={cn(buttonVariants("primary", "lg"))}>
            {user ? "Open dashboard" : "Create an account"}
          </Link>
        </div>
      </section>
    </div>
  );
}
