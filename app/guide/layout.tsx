import type { Metadata } from "next";
import type { ReactNode } from "react";
import { metadataForRoute } from "@/lib/seo-config";

export const metadata: Metadata = metadataForRoute("/guide");

export default function GuideLayout({ children }: { children: ReactNode }) {
  return children;
}
