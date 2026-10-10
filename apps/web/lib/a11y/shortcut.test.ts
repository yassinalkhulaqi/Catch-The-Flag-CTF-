import { describe, expect, it } from "vitest";
import { isTypingTarget } from "@/lib/a11y/shortcut";

describe("isTypingTarget", () => {
  it("ignores shortcut keys while a field is focused", () => {
    const input = document.createElement("input");
    const button = document.createElement("button");
    expect(isTypingTarget(input)).toBe(true);
    expect(isTypingTarget(button)).toBe(false);
    expect(isTypingTarget(null)).toBe(false);
  });
});
