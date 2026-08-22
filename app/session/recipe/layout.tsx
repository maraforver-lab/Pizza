import type { Metadata } from "next";
import type { ReactNode } from "react";
import { noindexMetadata } from "@/lib/seo-config";

export const metadata: Metadata = noindexMetadata(
  "Pizza Recipe | DoughTools",
  "Private DoughTools Pizza Session recipe workspace.",
);

export default function SessionRecipeLayout({ children }: { children: ReactNode }) {
  return children;
}
