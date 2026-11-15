import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

// Security headers (docs/security.md §4). The CSP keeps `unsafe-inline`
// for scripts/styles ONLY because Next.js itself emits inline runtime
// chunks and styled-jsx/Tailwind inline styles; there is no `unsafe-eval`,
// `object-src 'none'` blocks plugins/embeds, and `frame-ancestors 'none'`
// forbids framing the app at all. The theme boot script runs before paint
// and must stay inline, so do not remove it from the allowlist without
// replacing it with a nonce-based bootstrap.
//
// Production additionally pins transport (HSTS) and isolates the browsing
// context. These are omitted in development, where `next dev` serves plain
// http on localhost and a cached HSTS would break later local testing.
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "frame-ancestors 'none'",
      "form-action 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data:",
      "connect-src 'self'",
    ].join("; "),
  },
  ...(isProd
    ? [
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains; preload",
        },
      ]
    : []),
];

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
