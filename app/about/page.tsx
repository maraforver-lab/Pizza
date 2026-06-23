import type { Metadata } from "next";
import TrustPageLayout from "@/components/TrustPageLayout";
import { trustPages } from "@/lib/trust-pages";

export const metadata: Metadata = {
  title: "About | DoughTools",
  description: "What DoughTools is, who it is for and why it exists.",
};

export default function AboutPage() {
  return <TrustPageLayout page={trustPages.about} />;
}
