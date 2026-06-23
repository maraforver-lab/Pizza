import type { Metadata } from "next";
import TrustPageLayout from "@/components/TrustPageLayout";
import { trustPages } from "@/lib/trust-pages";

export const metadata: Metadata = {
  title: "Privacy Policy | DoughTools",
  description: "How DoughTools currently handles local browser storage, journal data and account authentication.",
};

export default function PrivacyPage() {
  return <TrustPageLayout page={trustPages.privacy} />;
}
