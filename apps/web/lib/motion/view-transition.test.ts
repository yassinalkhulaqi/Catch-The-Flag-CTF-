import { describe, expect, it, vi } from "vitest";
import { withViewTransition } from "@/lib/motion/view-transition";

describe("withViewTransition", () => {
  it("runs immediately when the browser has no view transition", () => {
    const run = vi.fn();
    withViewTransition(run);
    expect(run).toHaveBeenCalledOnce();
  });

  it("skips the animation when reduced motion is set", () => {
    const start = vi.fn();
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
    Object.assign(document, { startViewTransition: start });
    withViewTransition(() => undefined);
    expect(start).not.toHaveBeenCalled();
    window.matchMedia = original;
    delete (document as { startViewTransition?: unknown }).startViewTransition;
  });
});
