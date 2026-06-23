import type { Metadata } from "next";
import type { ReactNode } from "react";
import { metadataForRoute } from "@/lib/seo-config";

export const metadata: Metadata = metadataForRoute("/sauce");

export default function SauceLayout({ children }: { children: ReactNode }) {
  return children;
}
