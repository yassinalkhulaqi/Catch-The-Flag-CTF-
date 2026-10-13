import { describe, expect, it } from "vitest";
import { challengeBasicsSchema, pathCreateSchema } from "@/lib/admin/schemas";

describe("challengeBasicsSchema", () => {
  it("accepts a complete draft", () => {
    const parsed = challengeBasicsSchema.safeParse({
      title: "Known plaintext",
      slug: "known-plaintext",
      description: "Recover the message.",
      scenario: null,
      category_id: 1,
      difficulty: "beginner",
      points: 100,
      tag_ids: [3],
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects an empty title and a flag-like slug with spaces", () => {
    const parsed = challengeBasicsSchema.safeParse({
      title: "  ",
      slug: "Not A Slug",
      description: "",
      scenario: null,
      category_id: 0,
      difficulty: "beginner",
      points: 0,
      tag_ids: [],
    });
    expect(parsed.success).toBe(false);
  });
});

describe("pathCreateSchema", () => {
  it("requires a short summary", () => {
    const parsed = pathCreateSchema.safeParse({
      title: "SOC basics",
      slug: "soc-basics",
      summary: "",
      difficulty: "beginner",
      category_id: null,
    });
    expect(parsed.success).toBe(false);
  });
});
