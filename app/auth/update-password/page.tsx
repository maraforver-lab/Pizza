import type { Metadata } from "next";
import { Suspense } from "react";
import { UpdatePasswordClient } from "@/components/auth/UpdatePasswordClient";
import { noindexMetadata } from "@/lib/seo-config";

export const metadata: Metadata = noindexMetadata(
  "Update Password | DoughTools",
  "Set a new DoughTools account password.",
);

export default function UpdatePasswordPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-background-page px-4 py-8 text-ink">Checking your recovery link…</main>}>
      <UpdatePasswordClient />
    </Suspense>
  );
}
