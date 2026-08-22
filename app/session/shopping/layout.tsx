import type { Metadata } from "next";
import type { ReactNode } from "react";
import { noindexMetadata } from "@/lib/seo-config";

export const metadata: Metadata = noindexMetadata(
  "Pizza Shopping List | DoughTools",
  "Private DoughTools Pizza Session shopping workspace.",
);

export default function SessionShoppingLayout({ children }: { children: ReactNode }) {
  return children;
}
