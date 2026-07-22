import type { Metadata } from "next";
import { Suspense } from "react";
import DoughGuidePageClient from "@/components/guide/DoughGuidePageClient";
import { metadataForRoute } from "@/lib/seo-config";

export const metadata: Metadata = metadataForRoute("/guides/dough");

export default function PizzaDoughGuidePage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-cream px-4 py-10 text-ink">Loading Dough guides…</main>}>
      <DoughGuidePageClient />
    </Suspense>
  );
}
