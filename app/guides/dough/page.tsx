import type { Metadata } from "next";
import { Suspense } from "react";
import DoughGuidePageClient from "@/components/guide/DoughGuidePageClient";

export const metadata: Metadata = {
  title: "Pizza Dough Guide | DoughTools",
  description:
    "Learn how to make pizza dough step by step, from the first mix to a dough ball that is ready to stretch.",
};

export default function PizzaDoughGuidePage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-cream px-4 py-10 text-ink">Loading Pizza Dough Guide…</main>}>
      <DoughGuidePageClient />
    </Suspense>
  );
}
