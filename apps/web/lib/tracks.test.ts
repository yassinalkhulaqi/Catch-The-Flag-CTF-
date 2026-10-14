import { describe, expect, it } from "vitest";
import {
  TRACKS,
  isTier,
  normalizeTier,
  tierFor,
  trackForCategory,
  trackForChallenge,
} from "@/lib/tracks";

describe("tierFor", () => {
  it("maps beginner to Apprentice", () => {
    expect(tierFor("beginner")).toBe("apprentice");
  });

  it("maps intermediate to Practitioner", () => {
    expect(tierFor("intermediate")).toBe("practitioner");
  });

  it("maps advanced and expert to Expert", () => {
    expect(tierFor("advanced")).toBe("expert");
    expect(tierFor("expert")).toBe("expert");
  });
});

describe("isTier / normalizeTier", () => {
  it("accepts the three tiers case-insensitively", () => {
    expect(isTier("apprentice")).toBe(true);
    expect(isTier("Practitioner")).toBe(true);
    expect(isTier("EXPERT")).toBe(true);
  });

  it("rejects unknown values", () => {
    expect(isTier("beginner")).toBe(false);
    expect(isTier("")).toBe(false);
    expect(isTier(null)).toBe(false);
    expect(isTier(undefined)).toBe(false);
    expect(normalizeTier("nope")).toBeNull();
    expect(normalizeTier(null)).toBeNull();
  });
});

describe("TRACKS", () => {
  it("lists the twelve vulnerability tracks", () => {
    expect(TRACKS).toHaveLength(12);
    expect(TRACKS.map((t) => t.title)).toEqual([
      "SQL Injection",
      "XSS",
      "CSRF",
      "SSRF",
      "IDOR & Access Control",
      "Authentication",
      "File Upload",
      "Command Injection",
      "JWT & API",
      "Crypto",
      "Forensics",
      "Misc",
    ]);
  });

  it("gives every track a slug, blurb, and category matcher", () => {
    for (const track of TRACKS) {
      expect(track.slug).toBeTruthy();
      expect(track.blurb).toBeTruthy();
      expect(track.categorySlugs.length).toBeGreaterThan(0);
    }
  });
});

describe("trackForCategory", () => {
  it("resolves backend category slugs", () => {
    expect(trackForCategory("crypto").slug).toBe("crypto");
    expect(trackForCategory("forensics").slug).toBe("forensics");
    expect(trackForCategory("network").slug).toBe("forensics");
    expect(trackForCategory("osint").slug).toBe("forensics");
    expect(trackForCategory("misc").slug).toBe("misc");
    expect(trackForCategory("pwn").slug).toBe("misc");
    expect(trackForCategory("reverse").slug).toBe("misc");
  });

  it("returns the first web track for the shared web category", () => {
    expect(trackForCategory("web").slug).toBe("sql-injection");
  });

  it("falls back to Misc for unknown or empty slugs", () => {
    expect(trackForCategory("not-a-category").slug).toBe("misc");
    expect(trackForCategory(null).slug).toBe("misc");
    expect(trackForCategory(undefined).slug).toBe("misc");
    expect(trackForCategory("  ").slug).toBe("misc");
  });
});

describe("trackForChallenge", () => {
  it("prefers tag matches over the shared web category", () => {
    expect(trackForChallenge("web", ["xss"]).slug).toBe("xss");
    expect(trackForChallenge("web", ["SQL-Injection"]).slug).toBe("sql-injection");
    expect(trackForChallenge("web", ["jwt"]).slug).toBe("jwt-api");
  });

  it("falls back to the category when tags do not match", () => {
    expect(trackForChallenge("crypto", ["unknown-tag"]).slug).toBe("crypto");
    expect(trackForChallenge("crypto", []).slug).toBe("crypto");
  });

  it("falls back to Misc for unknown categories and tags", () => {
    expect(trackForChallenge("nope", ["nope"]).slug).toBe("misc");
  });
});
