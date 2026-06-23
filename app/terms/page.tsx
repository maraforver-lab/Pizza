import type { Metadata } from "next";
import TrustPageLayout from "@/components/TrustPageLayout";
import { trustPages } from "@/lib/trust-pages";

export const metadata: Metadata = {
  title: "Terms of Use | DoughTools",
  description: "Plain-English DoughTools terms covering estimates, limitations and user responsibility.",
};

export default function TermsPage() {
  return <TrustPageLayout page={trustPages.terms} />;
}
