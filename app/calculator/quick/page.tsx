import type { Metadata } from "next";
import QuickDoughCalculator from "@/components/quick-calculator/QuickDoughCalculator";

export const metadata: Metadata = {
  title: "Quick Dough Calculator | DoughTools",
  description: "Calculate pizza dough ingredient amounts without creating a Pizza Session.",
};

export default function QuickCalculatorPage() {
  return <QuickDoughCalculator />;
}
