import { CategoryShowcase } from "@/components/landing/categories";
import { FeaturedChallenges, FeaturedPaths } from "@/components/landing/featured";
import { FinalCTA } from "@/components/landing/final-cta";
import { Guarantees } from "@/components/landing/guarantees";
import { LandingHero } from "@/components/landing/hero";
import { HowItWorks } from "@/components/landing/how-it-works";
import { LeaderboardPreview } from "@/components/landing/leaderboard-preview";
import { CatalogStats } from "@/components/landing/stats";
import { getCurrentUser, serverApi } from "@/lib/api/server";
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
      <Guarantees />
      <FinalCTA signedIn={!!user} />
    </div>
  );
}
