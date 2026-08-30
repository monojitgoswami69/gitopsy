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

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://gitopsy.dev";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "GITOPSY • Your GitHub, Under Examination",
    template: "%s | GITOPSY",
  },
  description:
    "Privacy-first forensic engineering intelligence and analytics for GitHub. In-browser autopsy of your commits, pull requests, issues, languages, code churn, and developer diagnosis.",
  applicationName: "GITOPSY",
  authors: [{ name: "Monojit Goswami", url: "https://github.com/monojitgoswami69" }],
  creator: "Monojit Goswami",
  publisher: "GITOPSY",
  keywords: [
    "GitHub Analytics",
    "Developer Intelligence",
    "Forensic Git Analysis",
    "GitHub Wrapped",
    "Developer Archetype",
    "Code Churn Analysis",
    "Commit Forensics",
    "Git History Analysis",
    "Privacy First GitHub",
    "Neobrutalism",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "GITOPSY",
    title: "GITOPSY • Your GitHub, Under Examination",
    description:
      "Privacy-first forensic engineering intelligence and analytics for GitHub. In-browser autopsy of your commits, pull requests, issues, languages, code churn, and developer diagnosis.",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "GITOPSY - Forensic GitHub Intelligence & Analytics",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "GITOPSY • Your GitHub, Under Examination",
    description:
      "Privacy-first forensic engineering intelligence and analytics for GitHub. In-browser autopsy of your commits, pull requests, issues, languages, code churn, and developer diagnosis.",
    images: ["/og.png"],
    creator: "@gitopsy",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
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
  themeColor: "#FFDC58",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "GITOPSY",
  url: siteUrl,
  description:
    "Privacy-first forensic engineering intelligence and analytics for GitHub. In-browser autopsy of your commits, pull requests, issues, code churn, and developer diagnosis.",
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Any",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  featureList: [
    "In-browser client-side GitHub analysis",
    "Zero data retention & complete privacy",
    "Interactive code churn timeline",
    "Commit forensics & night owl patterns",
    "Developer classifications & courtroom judgments",
    "Repository awards & achievement badges",
  ],
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
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
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
