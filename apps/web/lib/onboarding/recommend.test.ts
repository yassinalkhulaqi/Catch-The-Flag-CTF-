import { describe, expect, it } from "vitest";
import { recommendChallenge } from "@/lib/onboarding/recommend";
import type { ChallengeSummary } from "@/lib/types";

function challenge(partial: Partial<ChallengeSummary> & Pick<ChallengeSummary, "id" | "slug">): ChallengeSummary {
  return {
    title: partial.slug,
    category: { id: 1, name: "SOC", slug: "soc", color: null },
    difficulty: "beginner",
    points: 100,
    estimated_minutes: 20,
    tags: [],
    solved: false,
    solve_count: 0,
    status: "published",
    ...partial,
  };
}

describe("recommendChallenge", () => {
  it("prefers an unsolved challenge in a chosen discipline", () => {
    const picked = recommendChallenge(
      [
        challenge({ id: 1, slug: "solved-soc", solved: true }),
        challenge({ id: 2, slug: "crypto", category: { id: 2, name: "Cryptography", slug: "cryptography", color: null } }),
        challenge({ id: 3, slug: "soc-case" }),
      ],
      ["soc"],
    );
    expect(picked?.slug).toBe("soc-case");
  });

  it("falls back to the first unsolved challenge", () => {
    const picked = recommendChallenge(
      [challenge({ id: 1, slug: "first" }), challenge({ id: 2, slug: "second" })],
      ["malware-analysis"],
    );
    expect(picked?.slug).toBe("first");
  });

  it("returns null when every loaded challenge is solved", () => {
    expect(recommendChallenge([challenge({ id: 1, slug: "done", solved: true })], ["soc"])).toBeNull();
  });
});
