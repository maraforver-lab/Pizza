import type { Metadata } from "next";
import type { ReactNode } from "react";
import { metadataForLegacyRoute } from "@/lib/seo-config";

export const metadata: Metadata = metadataForLegacyRoute("/gear");

export default function GearLayout({ children }: { children: ReactNode }) {
  return children;
}
