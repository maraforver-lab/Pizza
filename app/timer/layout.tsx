import type { Metadata } from "next";
import type { ReactNode } from "react";
import { metadataForRoute } from "@/lib/seo-config";

export const metadata: Metadata = metadataForRoute("/timer");

export default function TimerLayout({ children }: { children: ReactNode }) {
  return children;
}
