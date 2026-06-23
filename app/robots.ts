import type { MetadataRoute } from "next";
import { robotsPolicy } from "@/lib/seo-config";

export default function robots(): MetadataRoute.Robots {
  return robotsPolicy();
}
