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
        className="border-b border-ink/10 bg-ink px-4 py-3 text-white sm:px-6 lg:px-8"
      >
        <div className="mx-auto flex max-w-7xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
            <p className="text-[0.68rem] font-extrabold uppercase tracking-[.2em] text-oven-gold">
              Admin prototype
            </p>
            <h1 id="admin-quick-calculator-preview-heading" className="font-display text-xl font-semibold leading-none text-white sm:text-2xl">
              {prototype.name}
            </h1>
            <p className="rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[0.65rem] font-extrabold uppercase tracking-[.16em] text-white/68">
              {prototype.status}
            </p>
          </div>
          <Link
            href="/admin#admin-quick-calculator-prototypes-heading"
            className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-4 text-sm font-extrabold text-white transition hover:bg-white/18 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-ink sm:w-auto"
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
