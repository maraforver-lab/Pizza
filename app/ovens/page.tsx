import SiteFooter from "@/components/SiteFooter";
import RelatedLearning, { LearningBreadcrumbs } from "@/components/learning/RelatedLearning";
import HeatBalanceDiagram from "@/components/ovens/HeatBalanceDiagram";
import OvenEnvironmentChapter from "@/components/ovens/OvenEnvironmentChapter";
import OvenEnvironmentComparison from "@/components/ovens/OvenEnvironmentComparison";
import OvenGuideHero from "@/components/ovens/OvenGuideHero";
import OvenProblemGuide from "@/components/ovens/OvenProblemGuide";
import OvenStyleFit from "@/components/ovens/OvenStyleFit";
import PreheatTimeline from "@/components/ovens/PreheatTimeline";
import OvenSupportBadge from "@/components/ovens/OvenSupportBadge";
import { DoughToolsIcon } from "@/components/icons";
import { ovenEnvironments, ovenUserFeedbackThemes, pizzaSessionOvenSupportSummary } from "@/lib/oven-education";

const chapterIds = ["home-oven", "home-oven-steel", "home-oven-stone", "high-heat-pizza-oven", "pan-baking"] as const;

const safetyItems = [
  "Follow the instructions for your specific oven and baking surface.",
  "Use outdoor-only appliances outdoors, never in enclosed spaces.",
  "Keep the oven on a stable, heat-resistant surface with safe clearance from combustible materials.",
  "Keep children and pets away from active heat.",
  "Manage fuel, cords and ventilation conservatively.",
  "Allow the oven, stone, steel or pan to cool completely before storage or cleaning.",
  "Do not use water or cleaning chemicals on a hot baking stone.",
  "Do not modify fuel, ventilation or safety systems.",
] as const;

export default function OvensPage() {
  return (
    <main className="min-h-screen bg-cream px-4 py-5 text-ink sm:px-6 sm:py-8">
      <div className="mx-auto max-w-7xl">
        <LearningBreadcrumbs current="Oven Guide" />
        <OvenGuideHero />

        <section className="mt-8 rounded-[1.75rem] border border-leaf/20 bg-leaf/10 p-5 sm:p-6" aria-labelledby="oven-product-truth-title">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 id="oven-product-truth-title" className="font-display text-3xl font-semibold">What DoughTools currently uses</h2>
              <p className="mt-3 max-w-4xl text-sm leading-6 text-ink/65">{pizzaSessionOvenSupportSummary}</p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <OvenSupportBadge support="supported" note="Home oven" />
              <OvenSupportBadge support="supported" note="Pizza oven" />
              <OvenSupportBadge support="education" note="Learning guide" />
            </div>
          </div>
        </section>

        <nav className="mt-8 rounded-[1.75rem] border border-ink/10 bg-white/76 p-4 shadow-card" aria-label="Oven guide section index">
          <p className="px-1 text-xs font-extrabold uppercase tracking-[.18em] text-ink/45">Jump to a section</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Heat basics", "#heat-basics"],
              ["Compare ovens", "#oven-environments"],
              ["Preheat and recovery", "#preheat-recovery"],
              ["Common problems", "#common-oven-problems"],
            ].map(([label, href]) => (
              <a
                key={href}
                href={href}
                className="rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm font-extrabold text-ink transition hover:border-tomato/30 hover:text-tomato focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato"
              >
                {label}
              </a>
            ))}
          </div>
        </nav>

        <div className="mt-10">
          <HeatBalanceDiagram />
        </div>

        <div className="mt-10">
          <OvenEnvironmentComparison />
        </div>

        <section className="mt-12 grid gap-6" aria-label="Oven environment lessons">
          {ovenEnvironments
            .filter((environment) => chapterIds.includes(environment.id as (typeof chapterIds)[number]))
            .map((environment, index) => (
              <OvenEnvironmentChapter key={environment.id} environment={environment} index={index} />
            ))}
        </section>

        <section className="mt-10 grid gap-5 lg:grid-cols-2" aria-labelledby="dough-topping-adaptation-title">
          <article className="rounded-[2rem] border border-ink/10 bg-white p-5 shadow-card sm:p-7">
            <p className="text-xs font-extrabold uppercase tracking-[.2em] text-tomato">Dough adaptation</p>
            <h2 id="dough-topping-adaptation-title" className="mt-3 font-display text-3xl font-semibold">Dough should match the heat.</h2>
            <div className="mt-5 grid gap-4">
              <div className="rounded-[1.25rem] bg-flour/70 p-4">
                <h3 className="text-sm font-extrabold">High heat, short bake</h3>
                <p className="mt-2 text-sm leading-6 text-ink/62">
                  The dough expands quickly, toppings have little time to dry, and excessive sugar, oil or moisture can burn fast.
                </p>
              </div>
              <div className="rounded-[1.25rem] bg-flour/70 p-4">
                <h3 className="text-sm font-extrabold">Lower heat, longer bake</h3>
                <p className="mt-2 text-sm leading-6 text-ink/62">
                  Dough may need a formula suited to browning and tenderness, and toppings must be controlled so the center does not stay wet.
                </p>
              </div>
            </div>
          </article>
          <article className="rounded-[2rem] border border-ink/10 bg-white p-5 shadow-card sm:p-7">
            <p className="text-xs font-extrabold uppercase tracking-[.2em] text-tomato">Sauce and toppings</p>
            <h2 className="mt-3 font-display text-3xl font-semibold">Moisture behaves differently in every oven.</h2>
            <div className="mt-5 grid gap-4">
              <div className="rounded-[1.25rem] bg-flour/70 p-4">
                <h3 className="text-sm font-extrabold">High-heat oven</h3>
                <p className="mt-2 text-sm leading-6 text-ink/62">
                  Use a thin sauce layer, restrained toppings and ingredients that can survive intense top heat.
                </p>
              </div>
              <div className="rounded-[1.25rem] bg-flour/70 p-4">
                <h3 className="text-sm font-extrabold">Home oven</h3>
                <p className="mt-2 text-sm leading-6 text-ink/62">
                  Longer exposure gives wet sauce, fresh cheese and heavy toppings more time to soften the base.
                </p>
              </div>
            </div>
          </article>
        </section>

        <div className="mt-10">
          <PreheatTimeline />
        </div>

        <section className="mt-10 rounded-[2rem] border border-ink/10 bg-white/78 p-5 shadow-card sm:p-7" aria-labelledby="measuring-temperature-title">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,.75fr)_minmax(0,1fr)] lg:items-center">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[.2em] text-tomato">Measuring temperature</p>
              <h2 id="measuring-temperature-title" className="mt-3 font-display text-3xl font-semibold sm:text-5xl">Measure the surface you actually launch on.</h2>
              <p className="mt-4 text-sm leading-7 text-ink/62">
                An infrared thermometer reads the surface it is pointed at. Measure near the launch area, avoid shiny metal reflections or flame readings, take more than one reading when heat is uneven, and still judge the bake by the pizza.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {["Oven display", "Surface reading", "Bake feedback"].map((label, index) => (
                <div key={label} className="rounded-[1.25rem] border border-ink/10 bg-flour/70 p-4 text-center">
                  <DoughToolsIcon name={index === 0 ? "thermometer" : index === 1 ? "scale" : "pizza"} size={32} className="mx-auto text-leaf" />
                  <p className="mt-3 text-sm font-extrabold">{label}</p>
                  <p className="mt-2 text-xs leading-5 text-ink/55">
                    {index === 0 ? "Useful context." : index === 1 ? "Launch-area clue." : "Final truth."}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="mt-10">
          <OvenStyleFit />
        </div>

        <div className="mt-10">
          <OvenProblemGuide />
        </div>

        <section className="mt-10 grid gap-5 lg:grid-cols-[minmax(0,.8fr)_minmax(0,1fr)]" aria-labelledby="user-feedback-title">
          <article className="rounded-[2rem] bg-forest-dark p-5 text-white shadow-raised sm:p-7">
            <p className="text-xs font-extrabold uppercase tracking-[.2em] text-oven-gold">What users struggle with most</p>
            <h2 id="user-feedback-title" className="mt-3 font-display text-3xl font-semibold">The same oven problems appear again and again.</h2>
            <p className="mt-4 text-sm leading-7 text-white/70">
              Community discussions are not formal rules, but they reveal recurring confusion: people often buy heat before they understand what kind of pizza they want.
            </p>
          </article>
          <ul className="grid gap-3 sm:grid-cols-2">
            {ovenUserFeedbackThemes.map((theme) => (
              <li key={theme} className="flex gap-3 rounded-[1.15rem] border border-ink/10 bg-white p-4 text-sm leading-6 text-ink/64">
                <span className="mt-1 text-tomato" aria-hidden="true">•</span>
                <span>{theme}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-10 rounded-[2rem] border border-tomato/15 bg-tomato/5 p-5 sm:p-7" aria-labelledby="oven-safety-title">
          <p className="text-xs font-extrabold uppercase tracking-[.2em] text-tomato">Safety</p>
          <h2 id="oven-safety-title" className="mt-3 font-display text-3xl font-semibold sm:text-5xl">Heat is useful because it is controlled.</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-ink/62">
            This is general guidance, not a replacement for your equipment manual. When the manual is more specific, follow the manual.
          </p>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {safetyItems.map((item) => (
              <li key={item} className="flex gap-3 rounded-[1.15rem] bg-white p-4 text-sm leading-6 text-ink/66">
                <DoughToolsIcon name="warning" size={20} className="mt-0.5 shrink-0 text-tomato" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        <div className="mt-10">
          <RelatedLearning
            title="Connect heat to the rest of the pizza"
            intro="Oven choice changes sauce moisture, topping load, dough timing and troubleshooting decisions."
            links={[
              { href: "/styles", title: "Pizza Style Atlas", description: "Match oven behavior to the style you want.", icon: "pizza" },
              { href: "/sauce", title: "Pizza Sauce", description: "Adjust sauce texture for home ovens and longer bakes.", icon: "water" },
              { href: "/guides/dough", title: "Dough Guide", description: "Handle dough so it suits the heat and bake time.", icon: "mixing-bowl" },
              { href: "/toppings", title: "Topping Balance Lab", description: "Control cheese, sauce and topping moisture.", icon: "pizza" },
              { href: "/gear", title: "Gear", description: "Understand steels, stones, pans and peels.", icon: "shopping-basket" },
              { href: "/guide/pizza-troubleshooting", title: "Troubleshooting", description: "Fix pale bases, wet centers and uneven baking.", icon: "warning" },
            ]}
            cta={{
              href: "/session/start",
              title: "Plan my next pizza",
              description: "Choose your oven in DoughTools and the broad baking guidance adapts.",
              icon: "calendar",
            }}
          />
        </div>

        <section className="mt-10 rounded-[2rem] bg-forest-dark p-6 text-white shadow-raised sm:p-8" aria-labelledby="oven-final-cta-title">
          <p className="text-xs font-extrabold uppercase tracking-[.22em] text-oven-gold">Ready to plan</p>
          <h2 id="oven-final-cta-title" className="mt-3 font-display text-3xl font-semibold sm:text-5xl">
            Ready to match the pizza to your oven?
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-white/70">
            Choose Home oven or Pizza oven in DoughTools. The plan keeps the oven category broad while the guide helps you make the method practical.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <a
              href="/session/start"
              className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-tomato px-5 py-3 text-sm font-extrabold text-white shadow-card transition hover:bg-white hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-forest-dark"
            >
              Plan my next pizza →
            </a>
            <a
              href="/styles"
              className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-extrabold text-white transition hover:bg-white hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-oven-gold focus-visible:ring-offset-2 focus-visible:ring-offset-forest-dark"
            >
              Compare pizza styles
            </a>
          </div>
        </section>
        <SiteFooter />
      </div>
    </main>
  );
}
