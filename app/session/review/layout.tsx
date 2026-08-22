import type { Metadata } from "next";
import type { ReactNode } from "react";
import { noindexMetadata } from "@/lib/seo-config";

export const metadata: Metadata = noindexMetadata(
  "Pizza Review | DoughTools",
  "Private DoughTools Pizza Session review workspace.",
);

export default function SessionReviewLayout({ children }: { children: ReactNode }) {
  return children;
}
