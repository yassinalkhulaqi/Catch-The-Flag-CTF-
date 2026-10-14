/**
 * Offline codec helpers for the security toolbox.
 *
 * Pure functions only: no network, no storage, no DOM access.
 * All transforms run locally in the browser so learners can practise
 * encoding/decoding without any backend round-trip.
 */

/** Percent-encode a string for use in a URL component. */
export function urlEncode(input: string): string {
  return encodeURIComponent(input);
}

/** Decode a percent-encoded string. Throws on malformed input. */
export function urlDecode(input: string): string {
  try {
    return decodeURIComponent(input);
  } catch {
    throw new Error("Invalid URL-encoded input.");
  }
}

/**
 * Base64-encode a string (UTF-8 safe: multi-byte characters survive
 * the round-trip, unlike a naive btoa() call on raw JS strings).
 */
export function base64Encode(input: string): string {
  const bytes = new TextEncoder().encode(input);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

/** Base64-decode to a UTF-8 string. Throws on malformed input. */
export function base64Decode(input: string): string {
  const clean = input.trim().replace(/\s+/g, "");
  if (clean.length % 4 !== 0 || !/^[A-Za-z0-9+/]*={0,2}$/.test(clean)) {
    throw new Error("Invalid Base64 input.");
  }
  try {
    const binary = atob(clean);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  } catch {
    throw new Error("Invalid Base64 input.");
  }
}

/** Hex-encode a string (UTF-8 bytes, lowercase hex). */
export function hexEncode(input: string): string {
  return Array.from(new TextEncoder().encode(input))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

/** Hex-decode to a UTF-8 string. Throws on malformed input. */
export function hexDecode(input: string): string {
  const clean = input.trim().replace(/^0x/i, "").replace(/\s+/g, "");
  if (clean === "") return "";
  if (!/^[0-9a-fA-F]*$/.test(clean)) {
    throw new Error("Invalid hex input: only 0-9, a-f allowed.");
  }
  if (clean.length % 2 !== 0) {
    throw new Error("Invalid hex input: odd number of digits.");
  }
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < bytes.length; i += 1) {
    bytes[i] = Number.parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  }
  return new TextDecoder().decode(bytes);
}

/** Escape the five HTML-significant characters. */
export function htmlEscape(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

/**
 * Unescape common HTML entities. Single pass with `&amp;` resolved last
 * so `&amp;lt;` decodes to `&lt;` (not `<`).
 */
export function htmlUnescape(input: string): string {
  return input
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;|&apos;/g, "'")
    .replace(/&#x2F;|&#47;/g, "/")
    .replace(/&#x60;|&#96;/g, "`")
    .replace(/&amp;/g, "&");
}

export interface JwtInspection {
  header: unknown;
  payload: unknown;
  /** Null when inspection succeeded; human-readable reason otherwise. */
  error: string | null;
}

function base64UrlDecodeToString(segment: string): string {
  let base64 = segment.replace(/-/g, "+").replace(/_/g, "/");
  const remainder = base64.length % 4;
  if (remainder === 2) base64 += "==";
  else if (remainder === 3) base64 += "=";
  else if (remainder !== 0) throw new Error("bad length");
  const binary = atob(base64);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

/**
 * Inspect a JWT's header and payload WITHOUT verifying the signature.
 * The result is always labelled "unverified" in the UI: anyone can mint
 * or tamper with the unsigned content, so it must never be trusted.
 */
export function jwtInspect(token: string): JwtInspection {
  const parts = token.trim().split(".");
  if (parts.length !== 3 || parts.some((part) => part === "")) {
    return {
      header: null,
      payload: null,
      error: "Malformed JWT: expected three base64url segments separated by dots.",
    };
  }
  try {
    const header: unknown = JSON.parse(base64UrlDecodeToString(parts[0]!));
    const payload: unknown = JSON.parse(base64UrlDecodeToString(parts[1]!));
    return { header, payload, error: null };
  } catch {
    return {
      header: null,
      payload: null,
      error: "Malformed JWT: header or payload is not valid base64url JSON.",
    };
  }
}

export type CodecMode = "url" | "base64" | "hex" | "html" | "jwt";
