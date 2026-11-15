import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const API_URL = process.env.API_URL ?? "http://localhost:8000";

const STATIC_ROUTES = [
  "/",
  "/about",
  "/challenges",
  "/paths",
  "/leaderboard",
  "/tools",
  "/tools/decoder",
  "/tools/cheatsheets",
  "/tools/sandbox",
];

/**
 * Public sitemap. Fetches published challenges/paths without a session
 * (drafts must never leak through it); on any API failure it degrades to the
 * static route list rather than failing the build.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((path) => ({
    url: `${BASE_URL}${path}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: path === "/" ? 1 : 0.6,
  }));

  const dynamicEntries: MetadataRoute.Sitemap = [];

  try {
    const [challengesRes, pathsRes] = await Promise.all([
      fetch(`${API_URL}/api/v1/challenges?status=published&per_page=100`, {
        cache: "no-store",
        headers: { Accept: "application/json" },
      }),
      fetch(`${API_URL}/api/v1/paths?per_page=100`, {
        cache: "no-store",
        headers: { Accept: "application/json" },
      }),
    ]);

    if (challengesRes.ok) {
      const payload = (await challengesRes.json()) as {
        data?: Array<{ slug?: string }>;
      };
      for (const item of payload.data ?? []) {
        if (typeof item.slug === "string" && item.slug.length > 0) {
          dynamicEntries.push({
            url: `${BASE_URL}/challenges/${item.slug}`,
            lastModified: now,
            changeFrequency: "weekly",
            priority: 0.8,
          });
        }
      }
    }

    if (pathsRes.ok) {
      const payload = (await pathsRes.json()) as {
        data?: Array<{ slug?: string }>;
      };
      for (const item of payload.data ?? []) {
        if (typeof item.slug === "string" && item.slug.length > 0) {
          dynamicEntries.push({
            url: `${BASE_URL}/paths/${item.slug}`,
            lastModified: now,
            changeFrequency: "weekly",
            priority: 0.7,
          });
        }
      }
    }
  } catch {
    // Static-only sitemap; the build must not depend on the API.
  }

  return [...staticEntries, ...dynamicEntries];
}
