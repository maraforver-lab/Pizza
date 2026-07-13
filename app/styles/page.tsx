import AppSignature from "@/components/AppSignature";
import RelatedLearning, { LearningBreadcrumbs } from "@/components/learning/RelatedLearning";
import PizzaStyleChapter from "@/components/styles/PizzaStyleChapter";
import PizzaStyleComparison from "@/components/styles/PizzaStyleComparison";
import PizzaStyleGoalGuide from "@/components/styles/PizzaStyleGoalGuide";
import PizzaStyleHero from "@/components/styles/PizzaStyleHero";
import PizzaStyleSupportBadge from "@/components/styles/PizzaStyleSupportBadge";
import { DoughToolsIcon } from "@/components/icons";
import { pizzaStyleEducation, pizzaStyleSupportSummary } from "@/lib/pizza-style-education";

const atlasFlow = [
  { title: "Dough", description: "Formula, fermentation and strength set the structure.", icon: "mixing-bowl" },
  { title: "Shape", description: "Round, thin, pan or sheet changes how the dough expands.", icon: "pizza" },
  { title: "Heat", description: "Oven environment decides how fast the crust and toppings cook.", icon: "flame" },
  { title: "Bake time", description: "A 90-second bake and a 14-minute bake need different dough behavior.", icon: "timer" },
  { title: "Texture", description: "Soft, foldable, crisp or airy is the result of the whole system.", icon: "success" },
] as const;

export default function StylesPage() {
  const neapolitan = pizzaStyleEducation.find((style) => style.id === "neapolitan")!;

  return (
    <main className="min-h-screen bg-cream px-4 py-5 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-7xl">
        <LearningBreadcrumbs current="Pizza Styles" />
        <PizzaStyleHero />

        <section className="mt-10 rounded-[2rem] border border-ink/10 bg-white/78 p-5 shadow-card sm:p-7" aria-labelledby="style-system-title">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,.72fr)_minmax(0,1fr)] lg:items-center">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[.2em] text-tomato">Start here</p>
              <h2 id="style-system-title" className="mt-3 font-display text-3xl font-semibold sm:text-5xl">
                A pizza style is more than its toppings.
              </h2>
              <p className="mt-4 text-sm leading-7 text-ink/62">
                Style comes from the combined effect of dough formulation, fermentation, thickness, shaping, pan or baking surface, oven temperature, bake time, sauce moisture, cheese behavior and topping order.
              </p>
              <p className="mt-3 text-sm leading-7 text-ink/62">
                Hydration matters, but it never defines a style by itself.
              </p>
            </div>
            <ol className="grid gap-3 sm:grid-cols-5 lg:grid-cols-5" aria-label="Dough to texture style system">
              {atlasFlow.map((step, index) => (
                <li key={step.title} className="rounded-[1.25rem] border border-ink/10 bg-flour/70 p-4">
                  <span className="grid h-10 w-10 place-items-center rounded-2xl bg-leaf/10 text-leaf" aria-hidden="true">
                    <DoughToolsIcon name={step.icon} size={24} />
                  </span>
                  <span className="mt-3 block text-[11px] font-extrabold uppercase tracking-[.18em] text-ink/38">0{index + 1}</span>
                  <strong className="mt-1 block text-sm text-ink">{step.title}</strong>
                  <span className="mt-2 block text-xs leading-5 text-ink/55">{step.description}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="mt-8 rounded-[1.75rem] border border-leaf/20 bg-leaf/10 p-5 sm:p-6" aria-labelledby="planner-support-title">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 id="planner-support-title" className="font-display text-3xl font-semibold">What DoughTools currently plans</h2>
              <p className="mt-3 max-w-4xl text-sm leading-6 text-ink/65">{pizzaStyleSupportSummary}</p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <PizzaStyleSupportBadge support={neapolitan.support} note={neapolitan.supportNote} />
              <PizzaStyleSupportBadge support="learning" note="Learning guide" />
            </div>
          </div>
        </section>

        <nav className="mt-8 rounded-[1.75rem] border border-ink/10 bg-white/76 p-4 shadow-card" aria-label="Pizza style index">
          <p className="px-1 text-xs font-extrabold uppercase tracking-[.18em] text-ink/45">Jump to a style</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {pizzaStyleEducation.map((style) => (
              <a
                key={style.id}
                href={`#${style.id}`}
                className="rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm font-extrabold text-ink transition hover:border-tomato/30 hover:text-tomato focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato"
              >
                {style.shortName}
                <span className="mt-1 block text-xs font-semibold text-ink/45">{style.supportNote}</span>
              </a>
            ))}
          </div>
        </nav>

        <div className="mt-10">
          <PizzaStyleComparison />
        </div>

        <section className="mt-12 grid gap-6" aria-label="Pizza style chapters">
          {pizzaStyleEducation.map((style, index) => (
            <PizzaStyleChapter key={style.id} style={style} index={index} />
          ))}
        </section>

        <div className="mt-10">
          <PizzaStyleGoalGuide />
        </div>

        <div className="mt-10">
          <RelatedLearning
            title="Keep learning by style"
            intro="Move from style identity into the variables that actually change the result."
            links={[
              { href: "/guide", title: "Pizza Learning Center", description: "Understand hydration, fermentation, flour strength and heat.", icon: "information" },
              { href: "/sauce", title: "Pizza Sauce", description: "Choose a sauce method that fits the bake and style.", icon: "water" },
              { href: "/guides/dough", title: "Dough Guide", description: "Follow the dough-making process step by step.", icon: "mixing-bowl" },
              { href: "/ovens", title: "Oven Guide", description: "Match the style to your real oven environment.", icon: "oven" },
              { href: "/toppings", title: "Toppings", description: "Manage cheese, sauce and topping moisture.", icon: "pizza" },
              { href: "/guide/pizza-troubleshooting", title: "Troubleshooting", description: "Fix dense crust, pale bases, sticky dough and launch issues.", icon: "warning" },
            ]}
            cta={{
              href: "/session/start",
              title: "Plan my next pizza",
              description: "Start with the style DoughTools supports today.",
              icon: "calendar",
            }}
          />
        </div>

        <section className="mt-10 rounded-[2rem] bg-forest-dark p-6 text-white shadow-raised sm:p-8" aria-labelledby="style-final-cta-title">
          <p className="text-xs font-extrabold uppercase tracking-[.22em] text-oven-gold">Ready to bake</p>
          <h2 id="style-final-cta-title" className="mt-3 font-display text-3xl font-semibold sm:text-5xl">
            Ready to plan the style DoughTools supports today?
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-white/70">
            Start with a Neapolitan-style Pizza Session. The Atlas remains here when you want to compare other style families and understand what changes.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <a
              href="/session/start"
              className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-tomato px-5 py-3 text-sm font-extrabold text-white shadow-card transition hover:bg-white hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-forest-dark"
            >
              Plan my next pizza →
            </a>
            <a
              href="/guide"
              className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-extrabold text-white transition hover:bg-white hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-oven-gold focus-visible:ring-offset-2 focus-visible:ring-offset-forest-dark"
            >
              Return to the Learning Center
            </a>
          </div>
        </section>

        <footer className="mt-8 border-t border-ink/10 py-6">
          <AppSignature />
        </footer>
      </div>
    </main>
  );
}
