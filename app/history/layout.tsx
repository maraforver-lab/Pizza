import type { Metadata } from "next";
import type { ReactNode } from "react";
import { metadataForRoute } from "@/lib/seo-config";

export const metadata: Metadata = metadataForRoute("/history");

export default function HistoryLayout({ children }: { children: ReactNode }) {
  return children;
}
