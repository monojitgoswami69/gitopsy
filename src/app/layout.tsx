import type { Metadata } from "next";
import { JetBrains_Mono, Geist_Mono } from "next/font/google";
import "./globals.css";
import { HeaderNav } from "@/components/layout/HeaderNav";
import { Footer } from "@/components/layout/Footer";
import { KonamiListener } from "@/components/layout/KonamiListener";
import { ForensicWatermark } from "@/components/layout/ForensicWatermark";
import { SmoothScroll } from "@/components/providers/SmoothScroll";
import { GlobalAutopsyModal } from "@/components/layout/GlobalAutopsyModal";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "GITOPSY • Your GitHub, Under Examination",
  description:
    "Privacy-first forensic engineering intelligence and analytics for GitHub. In-browser autopsy of your commits, pull requests, issues, languages, vital signs, and developer diagnosis.",
  keywords: [
    "GitHub Analytics",
    "Developer Intelligence",
    "Forensic Git Analysis",
    "GitHub Wrapped",
    "Developer Archetype",
    "Neobrutalism",
  ],
  icons: {
    icon: [
      { url: "/favicon/favicon.ico" },
      { url: "/favicon/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    shortcut: "/favicon/favicon.ico",
    apple: [
      { url: "/favicon/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/favicon/site.webmanifest",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover" as const,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`h-full overflow-hidden ${jetbrainsMono.variable} ${geistMono.variable}`}
    >
      <body className="bg-[#F4EFE6] text-[#121212] font-body h-full w-full overflow-hidden flex flex-col selection:bg-[#FFDC58] selection:text-black relative">
        <SmoothScroll>
          <ForensicWatermark />
          <HeaderNav />
          <main id="app-main-scroll" className="flex-1 w-full overflow-y-auto overflow-x-hidden px-3 sm:px-6 py-4 sm:py-6 z-10 relative bg-grid-pattern">
            {children}
          </main>
          <KonamiListener />
          <GlobalAutopsyModal />
        </SmoothScroll>
      </body>
    </html>
  );
}
