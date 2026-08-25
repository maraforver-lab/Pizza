import type { Metadata, Viewport } from "next";
import { Inter, Newsreader } from "next/font/google";
import GlobalToolNavigation from "@/components/GlobalToolNavigation";
import LatestUpdateNotice from "@/components/LatestUpdateNotice";
import { SeoStructuredData } from "@/components/SeoStructuredData";
import { SeasonalThemeDecorations } from "@/components/SeasonalThemeDecorations";
import { getActivePublicTheme } from "@/lib/public-theme-campaigns";
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
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: ["/favicon.ico"],
  },
};

export async function generateViewport(): Promise<Viewport> {
  const { theme } = await getActivePublicTheme();

  return {
    themeColor: theme.themeColor,
    width: "device-width",
    initialScale: 1,
    viewportFit: "cover",
  };
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { theme } = await getActivePublicTheme();

  return (
    <html
      lang="en"
      data-public-theme={theme.id}
      className={`${inter.variable} ${newsreader.variable} ${theme.rootClassName}`}
    >
      <body className="font-sans"><SeoStructuredData/><SeasonalThemeDecorations/><GlobalToolNavigation/><LatestUpdateNotice/>{children}</body>
    </html>
  );
}
