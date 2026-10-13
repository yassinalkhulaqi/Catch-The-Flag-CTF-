import type { NextConfig } from "next";

// Security headers (docs/security.md §4). The CSP keeps `unsafe-inline`
// for scripts/styles ONLY because Next.js itself emits inline runtime
// chunks and styled-jsx/Tailwind inline styles; there is no `unsafe-eval`,
// `object-src 'none'` blocks plugins/embeds, and `frame-ancestors 'none'`
// forbids framing the app at all. API-layer hardening (nosniff, DENY,
// referrer, permissions) mirrors apps/api SecurityHeaders middleware.
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "frame-ancestors 'none'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data:",
      "connect-src 'self'",
    ].join("; "),
  },
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
