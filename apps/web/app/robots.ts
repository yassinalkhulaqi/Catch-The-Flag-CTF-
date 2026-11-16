import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/about", "/challenges", "/paths", "/leaderboard", "/tools"],
        disallow: [
          "/admin",
          "/api",
          "/dashboard",
          "/solves",
          "/bookmarks",
          "/progress",
          "/achievements",
          "/notifications",
          "/settings",
          "/profile",
          "/dev",
          "/maintenance",
          "/login",
          "/register",
          "/forgot-password",
          "/reset-password",
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
