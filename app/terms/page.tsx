import type { Metadata } from "next";
import TrustPageLayout from "@/components/TrustPageLayout";
import { metadataForRoute } from "@/lib/seo-config";
import { trustPages } from "@/lib/trust-pages";

export const metadata: Metadata = metadataForRoute("/terms");

export default function TermsPage() {
  return <TrustPageLayout page={trustPages.terms} />;
}
