/**
 * Category color fallbacks. The API may send `category.color`; when it does
 * not, the slug maps onto a token. Unknown slugs use the accent.
 */

const SLUG_TOKEN: Record<string, string> = {
  soc: "var(--category-soc)",
  "security-operations": "var(--category-soc)",
  dfir: "var(--category-dfir)",
  "digital-forensics": "var(--category-dfir)",
  forensics: "var(--category-dfir)",
  "network-forensics": "var(--category-network)",
  network: "var(--category-network)",
  malware: "var(--category-malware)",
  "malware-analysis": "var(--category-malware)",
  re: "var(--category-re)",
  "reverse-engineering": "var(--category-re)",
  crypto: "var(--category-crypto)",
  cryptography: "var(--category-crypto)",
  osint: "var(--category-osint)",
  stego: "var(--category-stego)",
  steganography: "var(--category-stego)",
};

export function categoryColor(slug: string | null | undefined, apiColor?: string | null): string {
  if (apiColor && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(apiColor)) return apiColor;
  if (!slug) return "var(--accent)";
  return SLUG_TOKEN[slug] ?? "var(--accent)";
}

export const CATEGORY_FALLBACKS: Array<{ slug: string; label: string; token: string }> = [
  { slug: "soc", label: "SOC", token: "--category-soc" },
  { slug: "digital-forensics", label: "DFIR", token: "--category-dfir" },
  { slug: "network-forensics", label: "Network forensics", token: "--category-network" },
  { slug: "malware-analysis", label: "Malware", token: "--category-malware" },
  { slug: "reverse-engineering", label: "Reverse engineering", token: "--category-re" },
  { slug: "cryptography", label: "Cryptography", token: "--category-crypto" },
  { slug: "osint", label: "OSINT", token: "--category-osint" },
  { slug: "steganography", label: "Steganography", token: "--category-stego" },
];
