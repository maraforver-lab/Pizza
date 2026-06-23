import type { Metadata } from "next";
import type { ReactNode } from "react";
import { metadataForRoute } from "@/lib/seo-config";

export const metadata: Metadata = metadataForRoute("/plan");

export default function PlanLayout({ children }: { children: ReactNode }) {
  return children;
}
