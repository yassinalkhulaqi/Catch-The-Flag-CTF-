import { describe, expect, it } from "vitest";
import type { Achievement } from "@/lib/types";
import {
  achievementRatio,
  awardedDay,
  cabinetSummary,
  filterCabinet,
  isInProgress,
  isLocked,
  nextMilestone,
  searchCabinet,
  sortCabinet,
  targetBand,
} from "@/lib/achievements/cabinet";

function badge(
  overrides: Partial<Achievement> & Pick<Achievement, "id" | "title">,
): Achievement {
  return {
    key: `badge-${overrides.id}`,
    description: `${overrides.title} description`,
    icon: null,
    awarded: false,
    ...overrides,
  };
}

const unlocked = badge({
  id: 1,
  title: "First blood",
  key: "first-blood",
  awarded: true,
  awarded_at: "2026-01-10T12:00:00Z",
  progress: { current: 1, target: 1 },
});

const started = badge({
  id: 2,
  title: "Five solves",
  key: "five-solves",
  awarded_at: null,
  progress: { current: 3, target: 5 },
});

const locked = badge({
  id: 3,
  title: "Ten solves",
  key: "ten-solves",
  progress: { current: 0, target: 10 },
});

const noTarget = badge({ id: 4, title: "Mystery badge", key: "mystery" });

const items = [unlocked, started, locked, noTarget];

describe("achievementRatio", () => {
  it("returns 1 for awarded badges", () => {
    expect(achievementRatio(unlocked)).toBe(1);
  });

  it("clamps progress ratios", () => {
    expect(achievementRatio(started)).toBe(0.6);
    expect(achievementRatio({ ...started, progress: { current: 9, target: 5 } })).toBe(1);
    expect(achievementRatio({ ...started, progress: { current: -2, target: 5 } })).toBe(0);
  });

  it("returns 0 without a target", () => {
    expect(achievementRatio(noTarget)).toBe(0);
    expect(achievementRatio({ ...started, progress: { current: 3, target: 0 } })).toBe(0);
  });
});

describe("state predicates", () => {
  it("separates awarded, in-progress, and locked badges", () => {
    expect(isInProgress(started)).toBe(true);
    expect(isLocked(locked)).toBe(true);
    expect(isLocked(noTarget)).toBe(true);
    expect(isInProgress(unlocked)).toBe(false);
    expect(isLocked(unlocked)).toBe(false);
  });
});

describe("filterCabinet", () => {
  it("filters by award state", () => {
    expect(filterCabinet(items, "unlocked")).toEqual([unlocked]);
    expect(filterCabinet(items, "progress")).toEqual([started]);
    expect(filterCabinet(items, "locked")).toEqual([locked, noTarget]);
    expect(filterCabinet(items, "all")).toHaveLength(4);
  });

  it("does not mutate the input", () => {
    const before = items.map((item) => item.id);
    filterCabinet(items, "all");
    expect(items.map((item) => item.id)).toEqual(before);
  });
});

describe("searchCabinet", () => {
  it("matches title, description, and key", () => {
    expect(searchCabinet(items, "five").map((item) => item.id)).toEqual([2]);
    expect(searchCabinet(items, "MYSTERY").map((item) => item.id)).toEqual([4]);
    expect(searchCabinet(items, "ten-solves").map((item) => item.id)).toEqual([3]);
  });

  it("returns everything for a blank query", () => {
    expect(searchCabinet(items, "  ")).toHaveLength(4);
  });
});

describe("sortCabinet", () => {
  it("keeps the server order by default", () => {
    expect(sortCabinet(items, "default").map((item) => item.id)).toEqual([1, 2, 3, 4]);
  });

  it("puts the closest incomplete badge first", () => {
    expect(sortCabinet(items, "closest").map((item) => item.id)).toEqual([2, 3, 4, 1]);
  });

  it("puts the most recent award first", () => {
    const newer = { ...unlocked, id: 5, title: "Newer", awarded_at: "2026-03-01T00:00:00Z" };
    const result = sortCabinet([...items, newer], "recent");
    expect(result[0].id).toBe(5);
    expect(result[1].id).toBe(1);
  });

  it("sorts alphabetically", () => {
    expect(sortCabinet(items, "alpha").map((item) => item.title)).toEqual([
      "First blood",
      "Five solves",
      "Mystery badge",
      "Ten solves",
    ]);
  });
});

describe("cabinetSummary", () => {
  it("counts states, completion, and highlights", () => {
    const summary = cabinetSummary(items);
    expect(summary.total).toBe(4);
    expect(summary.unlocked).toBe(1);
    expect(summary.inProgress).toBe(1);
    expect(summary.locked).toBe(2);
    expect(summary.completion).toBe(25);
    expect(summary.closest?.id).toBe(2);
    expect(summary.latest?.id).toBe(1);
  });

  it("handles an empty cabinet", () => {
    expect(cabinetSummary([])).toEqual({
      total: 0,
      unlocked: 0,
      inProgress: 0,
      locked: 0,
      completion: 0,
      closest: null,
      latest: null,
    });
  });

  it("reports full completion", () => {
    const summary = cabinetSummary([unlocked]);
    expect(summary.completion).toBe(100);
    expect(summary.closest).toBeNull();
  });
});

describe("targetBand", () => {
  it("maps thresholds to bands", () => {
    expect(targetBand(undefined)).toBe("unknown");
    expect(targetBand(0)).toBe("unknown");
    expect(targetBand(1)).toBe("starter");
    expect(targetBand(9)).toBe("starter");
    expect(targetBand(10)).toBe("core");
    expect(targetBand(49)).toBe("core");
    expect(targetBand(50)).toBe("elite");
  });
});

describe("nextMilestone", () => {
  it("reports current, target, and remaining", () => {
    expect(nextMilestone(started)).toEqual({ current: 3, target: 5, remaining: 2 });
  });

  it("returns null without a usable target", () => {
    expect(nextMilestone(noTarget)).toBeNull();
    expect(nextMilestone({ ...started, progress: { current: 1, target: 0 } })).toBeNull();
  });

  it("never reports negative remaining", () => {
    expect(nextMilestone({ ...started, progress: { current: 8, target: 5 } })).toEqual({
      current: 8,
      target: 5,
      remaining: 0,
    });
  });
});

describe("awardedDay", () => {
  it("formats a stable ISO day", () => {
    expect(awardedDay(unlocked)).toBe("2026-01-10");
  });

  it("returns null for missing or invalid dates", () => {
    expect(awardedDay(started)).toBeNull();
    expect(awardedDay({ ...unlocked, awarded_at: "not-a-date" })).toBeNull();
  });
});
