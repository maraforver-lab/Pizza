import type { Metadata } from "next";
import type { ReactNode } from "react";
import { metadataForLegacyRoute } from "@/lib/seo-config";

export const metadata: Metadata = metadataForLegacyRoute("/plan");

export default function PlanLayout({ children }: { children: ReactNode }) {
  return children;
}
