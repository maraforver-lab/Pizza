import type { Metadata } from "next";
import type { ReactNode } from "react";
import { metadataForRoute } from "@/lib/seo-config";

export const metadata: Metadata = metadataForRoute("/session/start");

export default function SessionStartLayout({ children }: { children: ReactNode }) {
  return children;
}
