import Link from "next/link";
import SiteFooter from "@/components/SiteFooter";
import { LearningBreadcrumbs } from "@/components/learning/RelatedLearning";
import { DoughToolsIcon } from "@/components/icons";
import PizzaStyleComparison from "@/components/styles/PizzaStyleComparison";
import PizzaStyleGoalGuide from "@/components/styles/PizzaStyleGoalGuide";
import PizzaStyleHero from "@/components/styles/PizzaStyleHero";
import PizzaStyleTechniqueNotes from "@/components/styles/PizzaStyleTechniqueNotes";

const practicalDifferences = [
  {
    title: "Dough and fermentation",
    icon: "mixing-bowl",
    body: "Styles may change hydration, dough-ball size, thickness, flour strength and fermentation timing. The comparison uses existing style preset data where DoughTools has it.",
    href: "/guides/dough",
    link: "Open Dough guides",
  },
  {
    title: "Oven and bake",
    icon: "oven",
    body: "High-heat pizza ovens, home-oven stone or steel setups, and pan bakes produce different results. A home oven can adapt a style, but it does not become the same environment as a dedicated pizza oven.",
    href: "/ovens",
    link: "Open Baking guides",
  },
  {
    title: "Sauce and toppings",
    icon: "water",
    body: "Soft, fast bakes usually need restrained moisture. Longer home-oven and pan bakes tolerate different cheese, sauce and topping loads when the structure supports them.",
    href: "/sauce",
    link: "Open Sauce guides",
  },
] as const;

export default function StylesPage() {
  return (
    <main className="min-h-screen bg-cream px-4 py-5 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-7xl">
        <LearningBreadcrumbs current="Choose your pizza" />
        <PizzaStyleHero />

        <PizzaStyleComparison />

        <PizzaStyleGoalGuide />

        <section className="mt-8 rounded-[2rem] border border-ink/10 bg-white/78 p-5 shadow-card sm:p-7" aria-labelledby="practical-differences-title">
          <p className="text-xs font-extrabold uppercase tracking-[.2em] text-tomato">What changes in practice</p>
          <h2 id="practical-differences-title" className="mt-3 font-display text-3xl font-semibold sm:text-5xl">
            Style changes the whole bake, not just the topping.
          </h2>
          <div className="mt-5 grid gap-3">
            {practicalDifferences.map((item) => (
              <article key={item.title} className="grid gap-3 rounded-[1.25rem] border border-ink/10 bg-flour/70 p-4 sm:grid-cols-[2.75rem_minmax(0,1fr)_auto] sm:items-start">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-leaf/10 text-leaf" aria-hidden="true">
                  <DoughToolsIcon name={item.icon} size={24} />
                </span>
                <div>
                  <h3 className="text-base font-extrabold text-ink">{item.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-ink/62">{item.body}</p>
                </div>
                <Link href={item.href} className="inline-flex text-sm font-extrabold text-tomato underline-offset-4 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato sm:pt-1">
                  {item.link}
                </Link>
              </article>
            ))}
          </div>
        </section>

        <PizzaStyleTechniqueNotes />

        <section className="mt-8 rounded-[1.75rem] border border-ink/10 bg-white/72 p-5 shadow-card sm:p-7" aria-labelledby="related-style-guides-title">
          <p className="text-xs font-extrabold uppercase tracking-[.2em] text-tomato">Focused guides</p>
          <h2 id="related-style-guides-title" className="mt-3 font-display text-3xl font-semibold sm:text-4xl">Use the dedicated guide for the next detail.</h2>
          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            {([
              { href: "/guides/dough", title: "Dough guides", description: "Process, fermentation and handling.", icon: "mixing-bowl" },
              { href: "/sauce", title: "Pizza Sauce", description: "Recipe method and sauce amount.", icon: "water" },
              { href: "/ovens", title: "Baking guides", description: "Equipment, heat and bake behavior.", icon: "oven" },
              { href: "/guide/pizza-troubleshooting", title: "Troubleshooting", description: "Dense crust, pale base, sticky dough and launch issues.", icon: "warning" },
            ] as const).map((link) => (
              <Link key={link.href} href={link.href} className="flex items-start gap-3 rounded-[1rem] border border-ink/10 bg-white px-4 py-3 transition hover:border-tomato/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-leaf/10 text-leaf" aria-hidden="true">
                  <DoughToolsIcon name={link.icon} size={20} />
                </span>
                <span>
                  <span className="block text-sm font-extrabold text-ink">{link.title}</span>
                  <span className="mt-0.5 block text-xs leading-5 text-ink/55">{link.description}</span>
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-[2rem] bg-forest-dark p-6 text-white shadow-raised sm:p-8" aria-labelledby="style-final-cta-title">
          <p className="text-xs font-extrabold uppercase tracking-[.22em] text-oven-gold">Ready to plan</p>
          <h2 id="style-final-cta-title" className="mt-3 font-display text-3xl font-semibold sm:text-5xl">
            Start with the style DoughTools can plan today.
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-white/70">
            Pizza Session uses your chosen oven, schedule, quantity and Neapolitan-style dough assumption to build the plan. Choose toppings later in Shopping.
          </p>
          <Link
            href="/session/start"
            className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-tomato px-5 py-3 text-sm font-extrabold text-white shadow-card transition hover:bg-white hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-forest-dark sm:w-auto"
          >
            Plan a pizza
          </Link>
        </section>
        <SiteFooter />
      </div>
    </main>
  );
}
