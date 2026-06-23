import type { Metadata } from "next";
import type { ReactNode } from "react";
import { metadataForRoute } from "@/lib/seo-config";

export const metadata: Metadata = metadataForRoute("/coach");

export default function CoachLayout({ children }: { children: ReactNode }) {
  return children;
}
