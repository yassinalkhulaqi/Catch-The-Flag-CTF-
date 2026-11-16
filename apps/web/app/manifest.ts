import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Catch The Flag",
    short_name: "CTF",
    description:
      "Learn offensive and defensive security through structured paths and static CTF challenges.",
    start_url: "/",
    display: "standalone",
    background_color: "#0b0f14",
    theme_color: "#f2b544",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
