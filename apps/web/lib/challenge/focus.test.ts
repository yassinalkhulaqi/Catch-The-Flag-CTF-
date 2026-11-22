import { describe, expect, it } from "vitest";
import {
  formatElapsed,
  focusProgress,
  focusSections,
  parseChecklist,
  sectionDomId,
  serializeChecklist,
  toggleChecklist,
  type FocusSectionKey,
} from "@/lib/challenge/focus";

const labels = Object.fromEntries(
  ["status", "objective", "briefing", "artifacts", "submit", "hints", "files", "walkthrough"].map(
    (key) => [key, `Label ${key}`],
  ),
) as Record<FocusSectionKey, string>;

const flags = {
  authenticated: true,
  hasFiles: true,
  hasHints: true,
  hasWalkthrough: true,
};

describe("sectionDomId", () => {
  it("uses a stable prefixed id", () => {
    expect(sectionDomId("briefing")).toBe("focus-briefing");
  });
});

describe("focusSections", () => {
  it("returns every section in page order when a walkthrough exists", () => {
    const sections = focusSections(flags, labels);
    expect(sections.map((section) => section.key)).toEqual([
      "status",
      "objective",
      "briefing",
      "artifacts",
      "submit",
      "hints",
      "files",
      "walkthrough",
    ]);
    expect(sections[0]).toEqual({
      key: "status",
      id: "focus-status",
      label: "Label status",
    });
  });

  it("omits the walkthrough when the server did not send one", () => {
    const sections = focusSections({ ...flags, hasWalkthrough: false }, labels);
    expect(sections.map((section) => section.key)).not.toContain("walkthrough");
    expect(sections).toHaveLength(7);
  });

  it("keeps public redirect sections available to guests", () => {
    const sections = focusSections({ ...flags, authenticated: false }, labels);
    expect(sections.map((section) => section.key)).toContain("submit");
    expect(sections.map((section) => section.key)).toContain("hints");
  });
});

describe("focusProgress", () => {
  const sections = focusSections(flags, labels);

  it("counts only known sections and ignores duplicates", () => {
    const progress = focusProgress(["status", "status", "unknown"], sections);
    expect(progress.count).toBe(1);
    expect(progress.total).toBe(8);
    expect(progress.percent).toBe(13);
  });

  it("reports completion", () => {
    const all = focusProgress(sections.map((section) => section.key), sections);
    expect(all).toEqual({ count: 8, total: 8, percent: 100 });
  });

  it("handles an empty section list", () => {
    expect(focusProgress([], [])).toEqual({ count: 0, total: 0, percent: 0 });
  });
});

describe("checklist serialization", () => {
  it("round-trips keys", () => {
    const keys = ["status", "briefing"];
    expect(parseChecklist(serializeChecklist(keys))).toEqual(keys);
  });

  it("ignores blanks and empty input", () => {
    expect(parseChecklist(null)).toEqual([]);
    expect(parseChecklist("status|| briefing |")).toEqual(["status", "briefing"]);
  });

  it("toggles a key in both directions", () => {
    expect(toggleChecklist([], "hints")).toEqual(["hints"]);
    expect(toggleChecklist(["hints", "files"], "hints")).toEqual(["files"]);
  });

  it("does not mutate the input", () => {
    const keys = ["hints"];
    toggleChecklist(keys, "files");
    expect(keys).toEqual(["hints"]);
  });
});

describe("formatElapsed", () => {
  it("formats minutes and seconds", () => {
    expect(formatElapsed(0)).toBe("00:00");
    expect(formatElapsed(65)).toBe("01:05");
    expect(formatElapsed(599)).toBe("09:59");
  });

  it("formats hours", () => {
    expect(formatElapsed(3600)).toBe("1:00:00");
    expect(formatElapsed(3725)).toBe("1:02:05");
  });

  it("clamps negative and fractional input", () => {
    expect(formatElapsed(-5)).toBe("00:00");
    expect(formatElapsed(9.9)).toBe("00:09");
  });
});
