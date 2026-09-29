import { describe, expect, it } from "vitest";
import { safeHref, safeInternalPath } from "@/lib/safe-url";

describe("safeInternalPath", () => {
  it("allows relative same-origin paths", () => {
    expect(safeInternalPath("/dashboard")).toBe("/dashboard");
    expect(safeInternalPath("/challenges/foo?x=1")).toBe("/challenges/foo?x=1");
  });

  it("blocks open redirects", () => {
    expect(safeInternalPath("//evil.com")).toBe("/dashboard");
    expect(safeInternalPath("/\\evil.com")).toBe("/dashboard");
    expect(safeInternalPath("https://evil.com")).toBe("/dashboard");
    expect(safeInternalPath("javascript:alert(1)")).toBe("/dashboard");
  });
});

describe("safeHref", () => {
  it("allows http(s), mailto, and relative paths", () => {
    expect(safeHref("https://example.com/a")).toBe("https://example.com/a");
    expect(safeHref("mailto:a@b.c")).toBe("mailto:a@b.c");
    expect(safeHref("/lessons/1")).toBe("/lessons/1");
  });

  it("blocks dangerous schemes", () => {
    expect(safeHref("javascript:alert(1)")).toBeUndefined();
    expect(safeHref("data:text/html,<script>")).toBeUndefined();
    expect(safeHref("//evil.com")).toBeUndefined();
  });
});
