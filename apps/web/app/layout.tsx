import type { Metadata } from "next";
import { Geist_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteDescription =
  "Cybersecurity learning paths and static CTF challenges — DFIR, malware analysis, reverse engineering, crypto, OSINT and more.";

export const metadata: Metadata = {
  title: {
    default: "Catch The Flag",
    template: "%s · Catch The Flag",
  },
  description: siteDescription,
  applicationName: "Catch The Flag",
  openGraph: {
    type: "website",
    siteName: "Catch The Flag",
    title: "Catch The Flag",
    description: siteDescription,
  },
  twitter: {
    card: "summary_large_image",
    title: "Catch The Flag",
    description: siteDescription,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
