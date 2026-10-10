export const en = {
  skip: "Skip to content",
  search: "Search",
  close: "Close",
  nav: {
    challenges: "Challenges",
    paths: "Paths",
    leaderboard: "Leaderboard",
    about: "About",
    dashboard: "Dashboard",
    admin: "Admin",
    login: "Log in",
    start: "Get started",
    logout: "Log out",
    menu: "Menu",
  },
  footer: "Cybersecurity learning + CTF",
  hero: {
    eyebrow: "Cybersecurity learning · static CTF",
    title: "Catch The Flag",
    lines: [
      "Learn the case. Hunt the artifact. Capture the flag.",
      "DFIR, malware, reverse engineering, crypto, OSINT, stego.",
      "XP is awarded by the server. The flag never comes back.",
    ],
    continue: "Continue training",
    start: "Get started",
    browse: "Browse challenges",
  },
  command: {
    title: "Search and jump",
    placeholder: "Search challenges or jump to a page",
    empty: "No matching pages or challenges.",
    close: "Close command palette",
  },
  theme: {
    label: "Theme",
    dark: "Dark",
    light: "Light",
    system: "System",
  },
  locale: {
    label: "Language",
    en: "English",
    ar: "Arabic",
  },
} as const;

type Loose<T> = T extends string
  ? string
  : T extends readonly (infer Item)[]
    ? readonly Loose<Item>[]
    : { [Key in keyof T]: Loose<T[Key]> };

export type Dictionary = Loose<typeof en>;
