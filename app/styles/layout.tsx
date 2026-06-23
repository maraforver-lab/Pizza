import type { Metadata } from "next";
import type { ReactNode } from "react";
import { metadataForRoute } from "@/lib/seo-config";

export const metadata: Metadata = metadataForRoute("/styles");

export default function StylesLayout({ children }: { children: ReactNode }) {
  return children;
}
