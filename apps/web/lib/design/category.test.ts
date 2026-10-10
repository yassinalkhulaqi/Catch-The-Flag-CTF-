import { describe, expect, it } from "vitest";
import { categoryColor } from "@/lib/design/category";

describe("categoryColor", () => {
  it("prefers a valid API hex color", () => {
    expect(categoryColor("soc", "#8B5CF6")).toBe("#8B5CF6");
  });

  it("falls back to the slug token", () => {
    expect(categoryColor("digital-forensics", null)).toBe("var(--category-dfir)");
    expect(categoryColor("cryptography")).toBe("var(--category-crypto)");
  });

  it("rejects non-hex colors and unknown slugs", () => {
    expect(categoryColor("soc", "red")).toBe("var(--category-soc)");
    expect(categoryColor("not-a-discipline", "javascript:alert(1)")).toBe("var(--accent)");
    expect(categoryColor(null, null)).toBe("var(--accent)");
  });
});
