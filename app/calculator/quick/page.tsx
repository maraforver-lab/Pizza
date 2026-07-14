import type { Metadata } from "next";
import QuickDoughCalculator from "@/components/quick-calculator/QuickDoughCalculator";
import { metadataForRoute } from "@/lib/seo-config";

export const metadata: Metadata = metadataForRoute("/calculator/quick");

export default function QuickCalculatorPage() {
  return <QuickDoughCalculator />;
}
