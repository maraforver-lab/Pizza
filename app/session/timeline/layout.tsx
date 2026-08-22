import type { Metadata } from "next";
import type { ReactNode } from "react";
import { noindexMetadata } from "@/lib/seo-config";

export const metadata: Metadata = noindexMetadata(
  "Pizza Timeline | DoughTools",
  "Private DoughTools Pizza Session timeline workspace.",
);

export default function SessionTimelineLayout({ children }: { children: ReactNode }) {
  return children;
}
