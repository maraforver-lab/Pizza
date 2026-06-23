import type { Metadata } from "next";
import TrustPageLayout from "@/components/TrustPageLayout";
import { trustPages } from "@/lib/trust-pages";

export const metadata: Metadata = {
  title: "Contact | DoughTools",
  description: "Contact placeholder for DoughTools support, privacy and feedback requests.",
};

export default function ContactPage() {
  return <TrustPageLayout page={trustPages.contact} />;
}
