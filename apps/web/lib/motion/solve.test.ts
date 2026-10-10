import { describe, expect, it, vi } from "vitest";
import { playSolve } from "@/lib/motion/solve";

describe("playSolve", () => {
  it("returns the server points and skips the burst when motion is reduced", async () => {
    const burst = vi.fn(() => () => undefined);
    const plan = await playSolve({
      origin: { x: 10, y: 20 },
      points: 120.8,
      reduced: true,
      burst,
    });
    expect(plan.points).toBe(120);
    expect(plan.celebrate).toBe(false);
    expect(burst).not.toHaveBeenCalled();
  });

  it("does not celebrate an already-solved challenge", async () => {
    const burst = vi.fn(() => () => undefined);
    const plan = await playSolve({
      origin: { x: 1, y: 1 },
      points: 0,
      alreadySolved: true,
      burst,
    });
    expect(plan.celebrate).toBe(false);
    expect(burst).not.toHaveBeenCalled();
  });

  it("starts a burst from the submit box when motion is allowed", async () => {
    const cancel = vi.fn();
    const burst = vi.fn(() => cancel);
    const plan = await playSolve({
      origin: { x: 40, y: 80 },
      points: 50,
      burst,
    });
    expect(plan.celebrate).toBe(true);
    expect(plan.points).toBe(50);
    expect(burst).toHaveBeenCalledWith({ x: 40, y: 80 });
    plan.cancel();
    expect(cancel).toHaveBeenCalledOnce();
  });
});
