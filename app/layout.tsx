import type { Metadata, Viewport } from "next";
import { Inter, Newsreader } from "next/font/google";
import GlobalToolNavigation from "@/components/GlobalToolNavigation";
import LatestUpdateNotice from "@/components/LatestUpdateNotice";
import WorkflowNextStep from "@/components/WorkflowNextStep";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const newsreader = Newsreader({ subsets: ["latin"], variable: "--font-newsreader", display: "swap" });
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  ?? (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "https://pizza-maraforver.vercel.app");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Pizza Dough Calculator | DoughTools",
  description: "A simple baker's percentage calculator for perfectly portioned pizza dough.",
  applicationName: "DoughTools",
  // TEMPORARY PRE-LAUNCH INDEXING BLOCK:
  // Remove this robots rule before DoughTools is ready for public search indexing.
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    title: "Make your own pizza with DoughTools",
    description: "Open this shared recipe or build your own pizza dough recipe.",
    type: "website",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "DoughTools pizza dough calculator" }],
  },
  twitter: { card: "summary_large_image", title: "Make your own pizza with DoughTools", description: "Open this shared recipe or build your own pizza dough recipe.", images: ["/opengraph-image"] },
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "DoughTools" },
  icons: { icon: "/icon.svg", apple: "/icon.svg" },
};

export const viewport: Viewport = {
  themeColor: "#f6f3ea",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${newsreader.variable}`}>
      <body className="font-sans"><GlobalToolNavigation/><LatestUpdateNotice/>{children}<WorkflowNextStep/></body>
    </html>
  );
}
