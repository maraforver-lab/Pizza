import type { Metadata } from "next";
import type { ReactNode } from "react";
import { noindexMetadata } from "@/lib/seo-config";

export const metadata: Metadata = noindexMetadata(
  "Pizza Journal | DoughTools",
  "Record personal pizza notes and baking results locally.",
);

export default function JournalLayout({ children }: { children: ReactNode }) {
  return children;
}
