import { describe, expect, it } from "vitest";
import { levelFromXp } from "@/lib/design/level";

describe("levelFromXp", () => {
  it("starts at level 1 with no XP", () => {
    const level = levelFromXp(0);
    expect(level.level).toBe(1);
    expect(level.floor).toBe(0);
    expect(level.next).toBe(100);
    expect(level.ratio).toBe(0);
  });

  it("crosses into level 2 at 100 XP", () => {
    expect(levelFromXp(100).level).toBe(2);
    expect(levelFromXp(99).level).toBe(1);
  });

  it("places 450 XP inside level 3", () => {
    const level = levelFromXp(450);
    expect(level.level).toBe(3);
    expect(level.floor).toBe(300);
    expect(level.next).toBe(600);
    expect(level.into).toBe(150);
    expect(level.ratio).toBeCloseTo(0.5);
  });

  it("treats garbage input as zero", () => {
    expect(levelFromXp(Number.NaN).level).toBe(1);
    expect(levelFromXp(-20).level).toBe(1);
    expect(levelFromXp(-20).into).toBe(0);
  });
});
