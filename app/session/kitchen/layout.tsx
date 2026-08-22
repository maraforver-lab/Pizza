import type { Metadata } from "next";
import type { ReactNode } from "react";
import { noindexMetadata } from "@/lib/seo-config";

export const metadata: Metadata = noindexMetadata(
  "Pizza Kitchen | DoughTools",
  "Private DoughTools Pizza Session kitchen workspace.",
);

export default function SessionKitchenLayout({ children }: { children: ReactNode }) {
  return children;
}
