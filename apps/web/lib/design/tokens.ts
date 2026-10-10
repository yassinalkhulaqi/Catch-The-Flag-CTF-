/**
 * Named design tokens for galleries, charts, and canvas code.
 * Colors resolve from CSS variables so light, dark, and system stay in sync.
 * Hex values live only in globals.css.
 */

export type ThemeName = "dark" | "light" | "system";

export const THEME_NAMES: ThemeName[] = ["dark", "light", "system"];

export interface TokenSpec {
  name: string;
  cssVar: `--${string}`;
  role: string;
  group: "surface" | "text" | "brand" | "semantic" | "difficulty" | "category";
}

export const COLOR_TOKENS: TokenSpec[] = [
  { name: "background", cssVar: "--background", role: "Page canvas", group: "surface" },
  { name: "surface", cssVar: "--surface", role: "Cards and panels", group: "surface" },
  { name: "surface-raised", cssVar: "--surface-raised", role: "Nested wells, code", group: "surface" },
  { name: "surface-overlay", cssVar: "--surface-overlay", role: "Menus and popovers", group: "surface" },
  { name: "border", cssVar: "--border", role: "Hairline separators", group: "surface" },
  { name: "border-strong", cssVar: "--border-strong", role: "Emphasized edges", group: "surface" },
  { name: "foreground", cssVar: "--foreground", role: "Primary text", group: "text" },
  { name: "muted", cssVar: "--muted", role: "Secondary text", group: "text" },
  { name: "faint", cssVar: "--faint", role: "Tertiary text, still AA on canvas", group: "text" },
  { name: "accent", cssVar: "--accent", role: "Signal amber — the flag marker", group: "brand" },
  { name: "accent-hover", cssVar: "--accent-hover", role: "Accent hover and active", group: "brand" },
  { name: "accent-foreground", cssVar: "--accent-foreground", role: "Text on accent fills", group: "brand" },
  { name: "success", cssVar: "--success", role: "Solved, saved, passed", group: "semantic" },
  { name: "warning", cssVar: "--warning", role: "Hint cost, caution", group: "semantic" },
  { name: "danger", cssVar: "--danger", role: "Incorrect, destructive", group: "semantic" },
  { name: "info", cssVar: "--info", role: "Neutral guidance", group: "semantic" },
  { name: "difficulty-beginner", cssVar: "--difficulty-beginner", role: "API difficulty: beginner (easy)", group: "difficulty" },
  { name: "difficulty-intermediate", cssVar: "--difficulty-intermediate", role: "API difficulty: intermediate (medium)", group: "difficulty" },
  { name: "difficulty-advanced", cssVar: "--difficulty-advanced", role: "API difficulty: advanced (hard)", group: "difficulty" },
  { name: "difficulty-expert", cssVar: "--difficulty-expert", role: "API difficulty: expert (insane)", group: "difficulty" },
  { name: "category-soc", cssVar: "--category-soc", role: "SOC fallback", group: "category" },
  { name: "category-dfir", cssVar: "--category-dfir", role: "Digital forensics fallback", group: "category" },
  { name: "category-network", cssVar: "--category-network", role: "Network forensics fallback", group: "category" },
  { name: "category-malware", cssVar: "--category-malware", role: "Malware analysis fallback", group: "category" },
  { name: "category-re", cssVar: "--category-re", role: "Reverse engineering fallback", group: "category" },
  { name: "category-crypto", cssVar: "--category-crypto", role: "Cryptography fallback", group: "category" },
  { name: "category-osint", cssVar: "--category-osint", role: "OSINT fallback", group: "category" },
  { name: "category-stego", cssVar: "--category-stego", role: "Steganography fallback", group: "category" },
];

export const SPACE_SCALE = [0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24] as const;

export const RADIUS_SCALE = [
  { name: "xs", cssVar: "--radius-xs" },
  { name: "sm", cssVar: "--radius-sm" },
  { name: "md", cssVar: "--radius-md" },
  { name: "lg", cssVar: "--radius-lg" },
  { name: "xl", cssVar: "--radius-xl" },
  { name: "2xl", cssVar: "--radius-2xl" },
] as const;

export const Z_INDEX = [
  { name: "base", value: 0 },
  { name: "raised", value: 10 },
  { name: "sticky", value: 40 },
  { name: "overlay", value: 50 },
  { name: "drawer", value: 60 },
  { name: "modal", value: 70 },
  { name: "toast", value: 80 },
  { name: "skip", value: 90 },
] as const;

export const MOTION = {
  duration: {
    instant: 80,
    fast: 140,
    base: 220,
    slow: 420,
    slower: 720,
  },
  ease: {
    out: "cubic-bezier(0.16, 1, 0.3, 1)",
    inOut: "cubic-bezier(0.65, 0, 0.35, 1)",
    spring: "cubic-bezier(0.34, 1.4, 0.64, 1)",
  },
} as const;

/** Read a custom property from :root. Safe during SSR (returns ""). */
export function readCssVar(name: string): string {
  if (typeof window === "undefined") return "";
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}
