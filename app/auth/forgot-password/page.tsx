import type { Metadata } from "next";
import { ForgotPasswordClient } from "@/components/auth/ForgotPasswordClient";
import { noindexMetadata } from "@/lib/seo-config";

export const metadata: Metadata = noindexMetadata(
  "Reset Password | DoughTools",
  "Request DoughTools password reset instructions.",
);

export default function ForgotPasswordPage() {
  return <ForgotPasswordClient />;
}
