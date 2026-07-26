import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import SiteFooter from "@/components/SiteFooter";
import { LearningBreadcrumbs } from "@/components/learning/RelatedLearning";
import SauceCalculator from "@/components/sauce/SauceCalculator";
import SaucePracticalGuidance from "@/components/sauce/SaucePracticalGuidance";

export const metadata: Metadata = {
  title: "Pizza Sauce Recipe and Calculator | DoughTools",
  description:
    "Calculate sauce per pizza, total pizza sauce, and a simple pizza sauce recipe for raw, Marinara or home-oven cooked sauce.",
};

export default function SaucePage() {
  return (
    <main className="min-h-screen overflow-x-clip bg-warm-background text-ink">
      <section className="border-b border-ink/10 bg-card">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 sm:py-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(18rem,0.5fr)] lg:items-center lg:px-8 lg:py-6">
          <div className="max-w-3xl">
            <LearningBreadcrumbs current="Sauce guides" />
            <p className="mt-6 text-xs font-extrabold uppercase tracking-[.24em] text-tomato">Sauce guides</p>
            <h1 className="mt-4 font-display text-4xl font-semibold leading-[0.95] tracking-tight sm:text-6xl">
              Pizza sauce, measured clearly.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-muted sm:text-lg">
              Choose a sauce style, calculate the right amount and learn how to spread it without making the pizza wet.
            </p>
          </div>
          <Image
            src="/sauce/application/clean-border.webp"
            alt="Pizza dough with an even tomato sauce layer and a clean uncovered crust border"
            width={960}
            height={960}
            priority
            sizes="(min-width: 1024px) 34vw, 100vw"
            className="aspect-[4/3] w-full rounded-[1.5rem] border border-ink/10 object-cover shadow-soft sm:aspect-[16/10] lg:h-48"
          />
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <SauceCalculator />

        <SaucePracticalGuidance />

        <section className="mt-12 rounded-[1.75rem] border border-ink/10 bg-forest-dark p-5 text-white shadow-soft sm:p-7" aria-labelledby="sauce-plan-title">
          <p className="text-xs font-extrabold uppercase tracking-[.2em] text-oven-gold">Ready to use it?</p>
          <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 id="sauce-plan-title" className="font-display text-3xl font-semibold sm:text-4xl">
                Plan a pizza with the sauce in mind.
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/70">
                Pizza Plan keeps the sauce, dough, toppings and bake in one practical workflow.
              </p>
            </div>
            <Link
              href="/session/start"
              className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-full bg-white px-5 text-sm font-extrabold text-forest-dark shadow-soft transition hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
            >
              Plan a pizza
            </Link>
          </div>
        </section>
        <SiteFooter />
      </div>
    </main>
  );
}
