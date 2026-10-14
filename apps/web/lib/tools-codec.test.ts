import { describe, expect, it } from "vitest";
import {
  base64Decode,
  base64Encode,
  hexDecode,
  hexEncode,
  htmlEscape,
  htmlUnescape,
  jwtInspect,
  urlDecode,
  urlEncode,
} from "@/lib/tools-codec";

function base64UrlEncode(value: string): string {
  return base64Encode(value).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

describe("tools-codec", () => {
  it("round-trips URL encoding, including unicode", () => {
    const original = "hello world & ünicode?x=1/2";
    expect(urlDecode(urlEncode(original))).toBe(original);
    expect(urlEncode("a b")).toBe("a%20b");
  });

  it("rejects malformed URL input", () => {
    expect(() => urlDecode("%E0%A4%A")).toThrow(/invalid url/i);
  });

  it("round-trips Base64, UTF-8 safe", () => {
    for (const original of ["", "flag{test}", "héllo→✓ emoji 🎉", "a".repeat(256)]) {
      expect(base64Decode(base64Encode(original))).toBe(original);
    }
    expect(base64Encode("Man")).toBe("TWFu");
  });

  it("rejects malformed Base64 input", () => {
    expect(() => base64Decode("!!!not-base64!!!")).toThrow(/invalid base64/i);
    expect(() => base64Decode("abc")).toThrow(/invalid base64/i);
  });

  it("round-trips hex, UTF-8 safe", () => {
    for (const original of ["", "ABC", "héllo ✓"]) {
      expect(hexDecode(hexEncode(original))).toBe(original);
    }
    expect(hexEncode("ABC")).toBe("414243");
  });

  it("rejects malformed hex input", () => {
    expect(() => hexDecode("zz")).toThrow(/invalid hex/i);
    expect(() => hexDecode("abc")).toThrow(/odd/i);
  });

  it("round-trips HTML escaping", () => {
    const original = `<a href="x" title='y'>&copy;</a>`;
    const escaped = htmlEscape(original);
    expect(escaped).not.toContain("<a");
    expect(htmlUnescape(escaped)).toBe(original);
  });

  it("does not double-decode entities", () => {
    expect(htmlUnescape("&amp;lt;")).toBe("&lt;");
  });

  it("inspects a well-formed JWT without verifying", () => {
    const token = [
      base64UrlEncode(JSON.stringify({ alg: "HS256", typ: "JWT" })),
      base64UrlEncode(JSON.stringify({ sub: "123", name: "learner" })),
      "signature-is-ignored",
    ].join(".");
    const result = jwtInspect(token);
    expect(result.error).toBeNull();
    expect(result.header).toEqual({ alg: "HS256", typ: "JWT" });
    expect(result.payload).toEqual({ sub: "123", name: "learner" });
  });

  it("reports malformed JWTs instead of throwing", () => {
    for (const bad of ["", "abc", "a.b", "a.b.c.d", "..", "a..c"]) {
      const result = jwtInspect(bad);
      expect(result.error).toMatch(/malformed jwt/i);
      expect(result.header).toBeNull();
      expect(result.payload).toBeNull();
    }
    expect(jwtInspect("a.b.c").error).toMatch(/malformed jwt/i);
  });
});
