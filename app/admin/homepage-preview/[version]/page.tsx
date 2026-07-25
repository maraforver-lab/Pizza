import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import HomepageRenderer from "@/components/homepage/HomepageRenderer";
import { DoughToolsIcon } from "@/components/icons";
import { getHomepageVersion } from "@/lib/homepage-versions";
import { noindexMetadata } from "@/lib/seo-config";

type HomepagePreviewPageProps = {
  params: Promise<{ version: string }>;
};

export const metadata: Metadata = noindexMetadata(
  "Homepage Preview | Admin | DoughTools",
  "Admin-only preview of registered DoughTools Homepage presentation versions.",
);

export default async function AdminHomepagePreviewPage({ params }: HomepagePreviewPageProps) {
  const { version: requestedVersion } = await params;
  const version = getHomepageVersion(requestedVersion);

  if (!version || !version.previewAvailable) {
    notFound();
  }

  return (
    <>
      <section
        aria-labelledby="admin-homepage-preview-heading"
        className="border-b border-ink/10 bg-ink px-4 py-4 text-white sm:px-6 lg:px-8"
      >
        <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[.24em] text-oven-gold">
              Admin preview — not the public Homepage
            </p>
            <h1 id="admin-homepage-preview-heading" className="mt-2 font-display text-2xl font-semibold leading-none sm:text-3xl">
              {version.name}
            </h1>
            <p className="mt-2 text-sm font-bold leading-6 text-white/70">
              Status: {version.status.toUpperCase()}
            </p>
          </div>
          <Link
            href="/admin#admin-homepage-versions-heading"
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-5 text-sm font-extrabold text-white transition hover:bg-white/18 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-ink sm:w-auto"
          >
            <DoughToolsIcon name="back" size={20} />
            Back to Homepage versions
          </Link>
        </div>
      </section>
      <HomepageRenderer versionId={version.id} />
    </>
  );
}
