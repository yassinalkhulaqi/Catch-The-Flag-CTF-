import type { ChallengeSummary } from "@/lib/types";

/** First unsolved challenge whose category slug is in the local interest list. */
export function recommendChallenge(
  challenges: ChallengeSummary[],
  interests: string[],
): ChallengeSummary | null {
  const unsolved = challenges.filter((challenge) => !challenge.solved);
  const match = unsolved.find((challenge) => interests.includes(challenge.category.slug));
  return match ?? unsolved[0] ?? null;
}

export function tourStorageKey(userId: number): string {
  return `ctf.tour.${userId}`;
}

export function interestStorageKey(userId: number): string {
  return `ctf.interests.${userId}`;
}
