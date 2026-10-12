import { describe, expect, it } from "vitest";
import { cn, formatXp, timeAgo } from "./utils";

describe("cn", () => {
  it("joins truthy class names", () => {
    expect(cn("a", false, "b", null, undefined, "c")).toBe("a b c");
  });
});

describe("formatXp", () => {
  it("formats thousands with separators", () => {
    expect(formatXp(1234567)).toBe("1,234,567");
  });

  it("formats zero", () => {
    expect(formatXp(0)).toBe("0");
  });
});

describe("timeAgo", () => {
  it("reports just now for recent timestamps", () => {
    expect(timeAgo(new Date().toISOString())).toBe("just now");
  });

  it("reports minutes and hours", () => {
    expect(timeAgo(new Date(Date.now() - 5 * 60_000).toISOString())).toBe(
      "5m ago",
    );
    expect(timeAgo(new Date(Date.now() - 3 * 3_600_000).toISOString())).toBe(
      "3h ago",
    );
  });
});
