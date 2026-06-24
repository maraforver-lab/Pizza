import type { Metadata } from "next";
import type { ReactNode } from "react";
import { metadataForRoute } from "@/lib/seo-config";

export const metadata: Metadata = metadataForRoute("/start");

export default function StartHereLayout({ children }: { children: ReactNode }) {
  return children;
}
