import Link from "next/link";
import SiteFooter from "@/components/SiteFooter";
import { LearningBreadcrumbs } from "@/components/learning/RelatedLearning";
import PizzaStyleAssistant from "@/components/styles/PizzaStyleAssistant";
import PizzaStyleComparison from "@/components/styles/PizzaStyleComparison";
import PizzaStyleHero from "@/components/styles/PizzaStyleHero";
import PizzaStyleTechniqueNotes from "@/components/styles/PizzaStyleTechniqueNotes";
import PizzaStyleVisualComparison from "@/components/styles/PizzaStyleVisualComparison";

export default function StylesPage() {
  return (
    <main className="min-h-screen bg-cream px-4 py-5 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-7xl">
        <LearningBreadcrumbs current="Choose your pizza" />
        <PizzaStyleHero />

        <PizzaStyleAssistant />

        <PizzaStyleVisualComparison />

        <PizzaStyleComparison />

        <PizzaStyleTechniqueNotes />

        <section className="mt-8 rounded-[1.5rem] bg-forest-dark p-5 text-white shadow-card sm:p-7" aria-labelledby="style-final-cta-title">
          <p className="text-xs font-extrabold uppercase tracking-[.22em] text-oven-gold">Ready to plan</p>
          <h2 id="style-final-cta-title" className="mt-3 font-display text-3xl font-semibold sm:text-4xl">
            Start with the style DoughTools can plan today.
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-white/70">
            Pizza Plan currently builds a Neapolitan-style plan around your oven, timing and quantity. Use the other styles here as learning references.
          </p>
          <Link
            href="/session/start"
            className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-tomato px-5 py-3 text-sm font-extrabold text-white shadow-card transition hover:bg-white hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-forest-dark sm:w-auto"
          >
            Plan a Neapolitan-style pizza
          </Link>
        </section>
        <SiteFooter />
      </div>
    </main>
  );
}
