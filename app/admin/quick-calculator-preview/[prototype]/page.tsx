import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DoughToolsIcon } from "@/components/icons";
import QuickCalculatorPrototypePreview from "@/components/quick-calculator/QuickCalculatorPrototypePreview";
import { getQuickCalculatorPrototype } from "@/lib/quick-calculator-prototypes";
import { noindexMetadata } from "@/lib/seo-config";

type QuickCalculatorPrototypePageProps = {
  params: Promise<{ prototype: string }>;
};

export const metadata: Metadata = noindexMetadata(
  "Quick Calculator Prototype Preview | Admin | DoughTools",
  "Admin-only preview of registered DoughTools Quick Calculator presentation prototypes.",
);

export default async function AdminQuickCalculatorPrototypePreviewPage({ params }: QuickCalculatorPrototypePageProps) {
  const { prototype: requestedPrototype } = await params;
  const prototype = getQuickCalculatorPrototype(requestedPrototype);

  if (!prototype || !prototype.previewAvailable) {
    notFound();
  }

  return (
    <>
      <section
        aria-labelledby="admin-quick-calculator-preview-heading"
        className="border-b border-ink/10 bg-ink px-4 py-4 text-white sm:px-6 lg:px-8"
      >
        <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[.24em] text-oven-gold">
              Admin prototype — not the public Quick Calculator
            </p>
            <h1 id="admin-quick-calculator-preview-heading" className="mt-2 font-display text-2xl font-semibold leading-none sm:text-3xl">
              {prototype.name}
            </h1>
            <p className="mt-2 text-sm font-bold leading-6 text-white/70">
              Status: {prototype.status.toUpperCase()}
            </p>
          </div>
          <Link
            href="/admin#admin-quick-calculator-prototypes-heading"
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-5 text-sm font-extrabold text-white transition hover:bg-white/18 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-ink sm:w-auto"
          >
            <DoughToolsIcon name="back" size={20} />
            Back to Quick Calculator prototypes
          </Link>
        </div>
      </section>
      <QuickCalculatorPrototypePreview prototype={prototype} />
    </>
  );
}
