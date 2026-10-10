import { describe, expect, it } from "vitest";
import { prefersReducedMotion } from "@/lib/motion/reduced";

describe("prefersReducedMotion", () => {
  it("returns false when the media query does not match", () => {
    expect(prefersReducedMotion()).toBe(false);
  });

  it("returns true when the user prefers reduced motion", () => {
    const original = window.matchMedia;
    window.matchMedia = ((query: string) => ({
      matches: query.includes("reduce"),
      media: query,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => false,
      onchange: null,
    })) as typeof window.matchMedia;
    expect(prefersReducedMotion()).toBe(true);
    window.matchMedia = original;
  });
});
