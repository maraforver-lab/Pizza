import type { Metadata } from "next";
import type { ReactNode } from "react";
import { metadataForRoute } from "@/lib/seo-config";

export const metadata: Metadata = metadataForRoute("/doctor");

export default function DoctorLayout({ children }: { children: ReactNode }) {
  return children;
}
