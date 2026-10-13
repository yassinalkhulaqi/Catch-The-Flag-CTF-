import { describe, expect, it } from "vitest";
import { heatmapFromTimestamps } from "@/components/charts/activity-heatmap";

describe("heatmapFromTimestamps", () => {
  it("counts ledger rows that share a UTC day", () => {
    const cells = heatmapFromTimestamps([
      "2026-10-01T01:00:00Z",
      "2026-10-01T18:00:00Z",
      "2026-10-02T00:00:00Z",
    ]);
    expect(cells).toEqual([
      { date: "2026-10-01", count: 2 },
      { date: "2026-10-02", count: 1 },
    ]);
  });

  it("drops unparseable timestamps", () => {
    expect(heatmapFromTimestamps(["not-a-date"])).toEqual([]);
  });
});
