import type { Metadata } from "next";
import type { ReactNode } from "react";
import { noindexMetadata } from "@/lib/seo-config";

export const metadata: Metadata = noindexMetadata(
  "Updates | DoughTools",
  "Review recent DoughTools product updates.",
);

export default function UpdatesLayout({ children }: { children: ReactNode }) {
  return children;
}
