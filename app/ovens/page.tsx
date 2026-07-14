import Link from "next/link";
import SiteFooter from "@/components/SiteFooter";
import { buttonClass, cardClass } from "@/components/design-system";
import { DoughToolsIcon, type DoughToolsIconName } from "@/components/icons";
import { LearningBreadcrumbs } from "@/components/learning/RelatedLearning";
import OvenGuideHero from "@/components/ovens/OvenGuideHero";
import { pizzaSessionOvenSupportSummary } from "@/lib/oven-education";
import { getPizzaSessionBakeProfile } from "@/lib/pizza-session-bake-profile";

const homeProfile = getPizzaSessionBakeProfile("home");
const pizzaProfile = getPizzaSessionBakeProfile("gas");

const ovenSetups = [
  {
    id: "home-oven",
    title: homeProfile.label,
    icon: "oven" as DoughToolsIconName,
    tone: "light",
    heat: homeProfile.temperatureLabel,
    preheat: `${homeProfile.preheatDurationMinutes} min Pizza Session preheat window`,
    bake: `${homeProfile.bakeTimeLabel} planning default`,
    placement: "Fully heated steel, stone or tray; choose rack position for top/bottom balance.",
    result: "Longer bake, more drying risk, steadier workflow and good browning when the surface is hot.",
    useWhen: "Use this for normal home ovens, tray bakes, stone bakes and steel bakes.",
  },
  {
    id: "pizza-oven",
    title: pizzaProfile.label,
    icon: "flame" as DoughToolsIconName,
    tone: "dark",
    heat: pizzaProfile.temperatureLabel,
    preheat: `${pizzaProfile.preheatDurationMinutes} min Pizza Session preheat window`,
    bake: `${pizzaProfile.bakeTimeLabel} planning default`,
    placement: "Launch onto the hot floor or stone where top heat and floor heat are balanced.",
    result: "Fast oven spring, rapid colour, lower topping tolerance and a short turning window.",
    useWhen: "Use this for dedicated high-heat pizza ovens and high-heat round pizza styles.",
  },
] as const;

const comparisonRows = [
  ["Heat", "What temperature can it realistically reach?", "Heat"],
  ["Preheat", "How long should I preheat it?", "Preheat"],
  ["Placement", "Where should the pizza go?", "Placement"],
  ["Bake", "How long should it bake?", "Bake"],
  ["Expected result", "What should I expect?", "Expected result"],
] as const;

const pizzaOvenSteps = [
  `Preheat for the current ${pizzaProfile.preheatDurationMinutes} min Pizza Session window and judge the floor, not only the flame.`,
  "Launch onto a balanced floor spot where the base can set before the rim scorches.",
  `${pizzaProfile.rotationGuidance} Start checking early because ${pizzaProfile.bakeTimeLabel} is a short bake window.`,
  "Remove when the rim is browned, the bottom is baked, and the cheese is melted.",
] as const;

const homeOvenSteps = [
  `Preheat for the current ${homeProfile.preheatDurationMinutes} min Pizza Session window so the surface is saturated, not just the oven air.`,
  `${homeProfile.surfaceGuidance} A tray remains a valid fallback when no stone or steel is available.`,
  `${homeProfile.rotationGuidance} Use broiler or grill help only when it is safe for your oven and the top is lagging.`,
  `Plan around ${homeProfile.bakeTimeLabel}, then judge the rim, bottom and cheese instead of treating the clock as exact.`,
] as const;

const surfaceGuidance = [
  {
    title: "Steel",
    body: "Fast bottom heat and strong browning. Watch for the base finishing before the top.",
  },
  {
    title: "Stone",
    body: "Gentler transfer and balanced bottom heat. Give it enough time to soak through.",
  },
  {
    title: "Tray",
    body: "Accessible fallback for home ovens. Expect a longer, less pizza-oven-like result.",
  },
] as const;

const improvementItems = [
  {
    title: "Pale or soft base",
    icon: "oven" as DoughToolsIconName,
    body: "The baking surface is usually underheated, too gentle, or overloaded with wet toppings.",
  },
  {
    title: "Burnt base, pale top",
    icon: "flame" as DoughToolsIconName,
    body: "Bottom heat is outrunning top heat. Move to a cooler zone, higher rack, or gentler surface next time.",
  },
  {
    title: "Top burns first",
    icon: "warning" as DoughToolsIconName,
    body: "Top heat is too aggressive for the surface underneath. Let the stone, steel or floor recover.",
  },
  {
    title: "Later pizzas get worse",
    icon: "timer" as DoughToolsIconName,
    body: "The surface lost heat. Pause between pizzas and judge the launch area before the next bake.",
  },
] as const;

const sessionEffects = [
  "Home oven and Pizza oven are the supported Pizza Session choices.",
  "The selected oven changes the preheat window and the baking copy used in Timeline and Kitchen Mode.",
  "DoughTools uses a planning default, while real bake time still depends on surface heat, topping moisture and visual doneness.",
  "Choosing Home oven does not promise a dedicated pizza-oven result; it plans for a longer home-oven rhythm.",
] as const;

const safetyItems = [
  "Follow your own appliance manual.",
  "Use outdoor-only ovens outdoors.",
  "Keep hot tools and launch paths clear.",
  "Let stone, steel and oven parts cool before handling.",
] as const;

function metricValue(setup: (typeof ovenSetups)[number], label: (typeof comparisonRows)[number][0]) {
  if (label === "Heat") return setup.heat;
  if (label === "Preheat") return setup.preheat;
  if (label === "Placement") return setup.placement;
  if (label === "Bake") return setup.bake;
  return setup.result;
}

export default function OvensPage() {
  return (
    <main className="min-h-screen overflow-x-clip bg-cream px-4 py-5 text-ink sm:px-6 sm:py-8">
      <div className="mx-auto max-w-7xl">
        <LearningBreadcrumbs current="Oven Guide" />
        <OvenGuideHero />

        <section id="oven-comparison" className="mt-6 scroll-mt-24" aria-labelledby="oven-comparison-title">
          <div className="rounded-[1.5rem] border border-leaf/20 bg-leaf/10 p-4 sm:p-5">
            <h2 id="oven-comparison-title" className="text-sm font-extrabold text-ink">
              Pick the oven path that matches your real heat
            </h2>
            <p className="mt-2 max-w-4xl text-sm leading-6 text-ink/65">{pizzaSessionOvenSupportSummary}</p>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {ovenSetups.map((setup) => {
              const dark = setup.tone === "dark";
              return (
                <article key={setup.id} className={cardClass({ className: "p-5 sm:p-6", variant: dark ? "dark" : "default" })}>
                  <div className="flex items-start gap-3">
                    <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${dark ? "bg-white/10 text-oven-gold" : "bg-tomato/10 text-tomato"}`} aria-hidden="true">
                      <DoughToolsIcon name={setup.icon} size={24} />
                    </span>
                    <div>
                      <h3 className="font-display text-3xl font-semibold">{setup.title}</h3>
                      <p className={`mt-2 text-sm leading-6 ${dark ? "text-white/70" : "text-ink/64"}`}>{setup.useWhen}</p>
                    </div>
                  </div>
                  <dl className="mt-5 grid gap-3">
                    {comparisonRows.map(([label, question]) => (
                      <div key={label} className={`rounded-[1rem] p-3 ${dark ? "bg-white/[.07]" : "bg-cream/70"}`}>
                        <dt className={`text-[0.68rem] font-black uppercase tracking-[.14em] ${dark ? "text-white/45" : "text-ink/42"}`}>
                          {question}
                        </dt>
                        <dd className={`mt-1 text-sm font-bold leading-5 ${dark ? "text-white/82" : "text-ink/74"}`}>{metricValue(setup, label)}</dd>
                      </div>
                    ))}
                  </dl>
                </article>
              );
            })}
          </div>
        </section>

        <section className="mt-8 grid gap-5 lg:grid-cols-2" aria-labelledby="actionable-bake-title">
          <div className="lg:col-span-2">
            <p className="text-xs font-extrabold uppercase tracking-[.2em] text-tomato">Bake instructions</p>
            <h2 id="actionable-bake-title" className="mt-3 font-display text-3xl font-semibold sm:text-5xl">
              Preheat the surface, place the pizza deliberately, then watch the result.
            </h2>
          </div>

          <article className={cardClass({ className: "p-5 sm:p-6", variant: "dark" })} aria-labelledby="pizza-oven-steps-title">
            <h3 id="pizza-oven-steps-title" className="font-display text-3xl font-semibold">Pizza oven</h3>
            <ol className="mt-5 grid gap-3">
              {pizzaOvenSteps.map((step, index) => (
                <li key={step} className="grid grid-cols-[2rem_minmax(0,1fr)] gap-3 text-sm leading-6 text-white/72">
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-oven-gold text-xs font-black text-ink">{index + 1}</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </article>

          <article className={cardClass({ className: "p-5 sm:p-6", variant: "default" })} aria-labelledby="home-oven-steps-title">
            <h3 id="home-oven-steps-title" className="font-display text-3xl font-semibold">Home oven</h3>
            <ol className="mt-5 grid gap-3">
              {homeOvenSteps.map((step, index) => (
                <li key={step} className="grid grid-cols-[2rem_minmax(0,1fr)] gap-3 text-sm leading-6 text-ink/66">
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-tomato text-xs font-black text-white">{index + 1}</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </article>
        </section>

        <section className="mt-8 grid gap-5 lg:grid-cols-[minmax(0,.78fr)_minmax(0,1fr)]" aria-labelledby="surface-title">
          <aside className={cardClass({ className: "p-5 sm:p-6", variant: "information" })}>
            <p className="text-xs font-extrabold uppercase tracking-[.2em] text-tomato">Stone, steel and tray</p>
            <h2 id="surface-title" className="mt-3 font-display text-3xl font-semibold">Home-oven surface choice changes the bottom heat.</h2>
            <dl className="mt-5 grid gap-3">
              {surfaceGuidance.map((item) => (
                <div key={item.title} className="rounded-[1rem] bg-white p-4">
                  <dt className="text-sm font-extrabold">{item.title}</dt>
                  <dd className="mt-1 text-sm leading-6 text-ink/62">{item.body}</dd>
                </div>
              ))}
            </dl>
          </aside>

          <article className={cardClass({ className: "p-5 sm:p-6", variant: "default" })} aria-labelledby="improve-title">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[.2em] text-tomato">Improve the setup</p>
                <h2 id="improve-title" className="mt-3 font-display text-3xl font-semibold">Use the baked pizza as feedback.</h2>
              </div>
              <Link href="/guide/pizza-troubleshooting" className={buttonClass({ className: "w-full shrink-0 sm:w-auto", variant: "secondary" })}>
                Open troubleshooting
              </Link>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {improvementItems.map((item) => (
                <section key={item.title} className="rounded-[1rem] border border-ink/10 bg-flour/70 p-4" aria-label={item.title}>
                  <DoughToolsIcon name={item.icon} size={20} className="text-tomato" />
                  <h3 className="mt-2 text-sm font-extrabold">{item.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-ink/62">{item.body}</p>
                </section>
              ))}
            </div>
          </article>
        </section>

        <section className="mt-8 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,.75fr)]" aria-labelledby="session-effect-title">
          <article className={cardClass({ className: "p-5 sm:p-6", variant: "success" })}>
            <p className="text-xs font-extrabold uppercase tracking-[.2em] text-tomato">Pizza Session effect</p>
            <h2 id="session-effect-title" className="mt-3 font-display text-3xl font-semibold sm:text-4xl">
              Use the same oven choice when you plan.
            </h2>
            <ul className="mt-5 grid gap-2 text-sm leading-6 text-ink/66">
              {sessionEffects.map((item) => (
                <li key={item} className="flex gap-2">
                  <DoughToolsIcon name="success" size={16} className="mt-1 shrink-0 text-leaf" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>

          <aside className="rounded-[1.5rem] border border-tomato/15 bg-tomato/5 p-5" aria-labelledby="oven-safety-title">
            <h2 id="oven-safety-title" className="text-sm font-extrabold text-ink">Safety checks</h2>
            <ul className="mt-3 grid gap-2">
              {safetyItems.map((item) => (
                <li key={item} className="flex gap-2 text-sm leading-6 text-ink/64">
                  <DoughToolsIcon name="warning" size={16} className="mt-1 shrink-0 text-tomato" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </aside>
        </section>

        <section className="mt-8 rounded-[2rem] bg-forest-dark p-6 text-white shadow-raised sm:p-8" aria-labelledby="oven-final-cta-title">
          <p className="text-xs font-extrabold uppercase tracking-[.22em] text-oven-gold">Ready to plan</p>
          <h2 id="oven-final-cta-title" className="mt-3 font-display text-3xl font-semibold sm:text-5xl">
            Plan with the oven you actually have.
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-white/70">
            Pizza Session uses your Home oven or Pizza oven choice for the current preheat window, bake guidance and kitchen instructions.
          </p>
          <div className="mt-6">
            <Link href="/session/start" className={buttonClass({ className: "w-full sm:w-auto", variant: "primary" })}>
              Plan my next pizza
            </Link>
          </div>
          <p className="mt-4 text-xs leading-5 text-white/52">
            For dough handling, use the <Link href="/guides/dough" className="font-bold text-oven-gold underline-offset-2 hover:underline">Dough Guide</Link>. For topping moisture, use the <Link href="/toppings" className="font-bold text-oven-gold underline-offset-2 hover:underline">Topping Balance Lab</Link>.
          </p>
        </section>

        <SiteFooter />
      </div>
    </main>
  );
}
