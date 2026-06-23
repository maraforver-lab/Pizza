import type { MetadataRoute } from "next";
import { sitemapEntries } from "@/lib/seo-config";

export default function sitemap(): MetadataRoute.Sitemap {
  return sitemapEntries();
}
