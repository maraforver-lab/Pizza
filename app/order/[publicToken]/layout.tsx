import type { Metadata } from "next";
import type { ReactNode } from "react";
import { noindexMetadata } from "@/lib/seo-config";

export const metadata: Metadata = noindexMetadata(
  "Party Order | DoughTools",
  "Private DoughTools Party Order form.",
);

export default function PublicPartyOrderLayout({ children }: { children: ReactNode }) {
  return children;
}
