import type { Metadata, Viewport } from "next";
import { Inter, Newsreader } from "next/font/google";
import GlobalToolNavigation from "@/components/GlobalToolNavigation";
import LatestUpdateNotice from "@/components/LatestUpdateNotice";
import { getSiteUrl, metadataForRoute } from "@/lib/seo-config";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const newsreader = Newsreader({ subsets: ["latin"], variable: "--font-newsreader", display: "swap" });

export const metadata: Metadata = {
  ...metadataForRoute("/"),
  metadataBase: new URL(getSiteUrl()),
  applicationName: "DoughTools",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "DoughTools" },
  icons: { icon: "/icon.svg", apple: "/icon.svg" },
};

export const viewport: Viewport = {
  themeColor: "#FFF8F1",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${newsreader.variable}`}>
      <body className="font-sans"><GlobalToolNavigation/><LatestUpdateNotice/>{children}</body>
    </html>
  );
}
