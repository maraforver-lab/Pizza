import type { Metadata } from "next";
import type { ReactNode } from "react";
import { metadataForLegacyRoute } from "@/lib/seo-config";

export const metadata: Metadata = metadataForLegacyRoute("/history");

export default function HistoryLayout({ children }: { children: ReactNode }) {
  return children;
}
