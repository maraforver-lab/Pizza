import type { Metadata } from "next";
import TrustPageLayout from "@/components/TrustPageLayout";
import { trustPages } from "@/lib/trust-pages";

export const metadata: Metadata = {
  title: "Calculation Methodology | DoughTools",
  description: "How DoughTools calculates pizza dough using baker’s percentages and fermentation estimates.",
};

export default function MethodologyPage() {
  return <TrustPageLayout page={trustPages.methodology} />;
}
