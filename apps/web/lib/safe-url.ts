/**
 * Safe URL / redirect helpers — never trust query params or Markdown hrefs.
 */

/** Same-origin relative path only (blocks //evil, /\\evil, protocol-relative). */
export function safeInternalPath(candidate: string | null | undefined, fallback = "/dashboard"): string {
  if (!candidate) return fallback;
  const path = candidate.trim();
  if (!path.startsWith("/")) return fallback;
  if (path.startsWith("//")) return fallback;
  if (path.includes("\\")) return fallback;
  if (path.includes("://")) return fallback;
  // Block control characters / CRLF injection
  if (/[\u0000-\u001f\u007f]/.test(path)) return fallback;
  return path;
}

const ALLOWED_HREF_SCHEMES = /^(https?:|mailto:)/i;

/** Allow http(s), mailto, or same-site relative paths for Markdown links. */
export function safeHref(href: string | null | undefined): string | undefined {
  if (!href) return undefined;
  const value = href.trim();
  if (!value) return undefined;
  if (value.startsWith("/") && !value.startsWith("//") && !value.includes("\\")) {
    return value;
  }
  if (ALLOWED_HREF_SCHEMES.test(value)) {
    try {
      const parsed = new URL(value);
      if (parsed.protocol === "javascript:" || parsed.protocol === "data:" || parsed.protocol === "vbscript:") {
        return undefined;
      }
      return value;
    } catch {
      return undefined;
    }
  }
  return undefined;
}
