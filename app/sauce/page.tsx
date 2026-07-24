import type { Metadata } from "next";
import Link from "next/link";
import SiteFooter from "@/components/SiteFooter";
import PublicPageEnding, { type PublicPageEndingLink } from "@/components/learning/PublicPageEnding";
import { LearningBreadcrumbs } from "@/components/learning/RelatedLearning";
import SauceCalculator from "@/components/sauce/SauceCalculator";
import SaucePracticalGuidance from "@/components/sauce/SaucePracticalGuidance";
import SauceQuickAnswer from "@/components/sauce/SauceQuickAnswer";

export const metadata: Metadata = {
  title: "Pizza Sauce Recipe and Calculator | DoughTools",
  description:
    "Calculate sauce per pizza, total pizza sauce, and a simple pizza sauce recipe for raw, Marinara or home-oven cooked sauce.",
};

const finalAction: PublicPageEndingLink = {
  title: "Plan a pizza",
  href: "/session/start",
  description: "Use the sauce in a real pizza plan.",
};

export default function SaucePage() {
  return (
    <main className="min-h-screen overflow-x-clip bg-warm-background text-ink">
      <section className="border-b border-ink/10 bg-card">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          <div className="max-w-3xl">
            <LearningBreadcrumbs current="Sauce guides" />
            <p className="mt-6 text-xs font-extrabold uppercase tracking-[.24em] text-tomato">Sauce guides</p>
            <h1 className="mt-4 font-display text-4xl font-semibold leading-[0.95] tracking-tight sm:text-6xl lg:text-7xl">
              Choose the sauce, then measure it clearly.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-muted sm:text-lg">
              Pick a simple sauce path first, then calculate the amount for each pizza and the batch.
            </p>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <SauceQuickAnswer />

        <div className="mt-8">
          <SauceCalculator />
        </div>

        <SaucePracticalGuidance />

        <section className="mt-12 rounded-[2rem] border border-ink/10 bg-card p-5 shadow-soft sm:p-7" aria-labelledby="sauce-sources-title">
          <p className="text-xs font-extrabold uppercase tracking-[.2em] text-tomato">Sources and methodology</p>
          <h2 id="sauce-sources-title" className="mt-3 font-display text-4xl font-semibold sm:text-5xl">
            Traditional guidance, practical home-oven adaptation.
          </h2>
          <p className="mt-4 text-sm leading-7 text-muted sm:text-base">
            Traditional Neapolitan guidance is based on AVPN regulations and preparation guidance. Practical home-oven
            adaptations are DoughTools recommendations, not claims that every sauce must be prepared one way.
            {" "}
            <Link href="/methodology#pizza-sauce" className="font-extrabold text-tomato underline-offset-4 hover:underline">
              View sources and methodology
            </Link>
            .
          </p>
        </section>

        <PublicPageEnding
          links={[]}
          relatedTitle=""
          action={finalAction}
          actionEyebrow="Ready to use the sauce in a real plan?"
          actionTitle="Plan a pizza with the sauce in mind."
        />
        <SiteFooter />
      </div>
    </main>
  );
}
