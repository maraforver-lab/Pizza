import type { Metadata } from "next";
import type { ReactNode } from "react";
import { metadataForRoute } from "@/lib/seo-config";

export const metadata: Metadata = metadataForRoute("/costs");

export default function CostsLayout({ children }: { children: ReactNode }) {
  return children;
}
