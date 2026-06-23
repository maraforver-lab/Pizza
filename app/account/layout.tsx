import type { Metadata } from "next";
import type { ReactNode } from "react";
import { noindexMetadata } from "@/lib/seo-config";

export const metadata: Metadata = noindexMetadata(
  "Account | DoughTools",
  "Manage DoughTools sign-in and account status.",
);

export default function AccountLayout({ children }: { children: ReactNode }) {
  return children;
}
