import Link from "next/link";
import SiteFooter from "@/components/SiteFooter";
import { buttonClass, cardClass } from "@/components/design-system";
import { DoughToolsIcon, type DoughToolsIconName } from "@/components/icons";
import { LearningBreadcrumbs } from "@/components/learning/RelatedLearning";
import OvenGuideHero from "@/components/ovens/OvenGuideHero";
import OvenSupportBadge from "@/components/ovens/OvenSupportBadge";
import { pizzaSessionOvenSupportSummary } from "@/lib/oven-education";

const ovenPaths = [
  {
    id: "home-oven",
    title: "Home oven",
    icon: "oven" as DoughToolsIconName,
    summary: "Lower heat, a longer bake and a more forgiving rhythm when the surface and toppings are managed well.",
    strengths: [
      "Easier repeatability indoors",
      "Works well with steel, stone, tray or pan",
      "More time for cheese and toppings to brown",
      "Good fit for New York, pan, thin and longer-baked styles",
      "Moisture management matters because the bake is longer",
      "Preheat the baking surface, not just the air",
    ],
  },
  {
    id: "pizza-oven",
    title: "Pizza oven",
    icon: "flame" as DoughToolsIconName,
    summary: "Much higher heat, a very short bake and fast decisions around launch, turning and topping restraint.",
    strengths: [
      "Rapid oven spring and rim expansion",
      "Strong top heat and hot floor",
      "Very short bake window",
      "Best suited to high-heat round pizza styles",
      "Restrained topping load is essential",
      "Watch floor recovery between pizzas",
    ],
  },
] as const;

const comparisonRows = [
  ["Heat", "Lower and steadier; surface saturation matters.", "Very high; floor and flame balance matter."],
  ["Bake character", "Longer, more controlled bake.", "Fast, intense bake with little margin."],
  ["Surface", "Steel, stone, tray or pan depending on style.", "Hot oven floor or stone surface."],
  ["Topping tolerance", "Moderate, but wet toppings can soften the base.", "Lower; overloaded toppings cannot dry in time."],
  ["Dough behavior", "Slower expansion and more drying risk.", "Rapid oven spring and quick rim color."],
  ["Learning curve", "Approachable and repeatable.", "Fast-paced launch and turning skill."],
  ["Best-suited families", "New York, pan, Roman thin and home-adapted styles.", "Neapolitan and contemporary high-heat round pizza."],
] as const;

const changeFactors = [
  {
    title: "Crust and oven spring",
    icon: "pizza" as DoughToolsIconName,
    home: "Expansion is slower, so the dough needs enough time and heat without drying out.",
    pizza: "Expansion happens quickly, giving stronger oven spring when the dough and launch are ready.",
  },
  {
    title: "Base texture",
    icon: "oven" as DoughToolsIconName,
    home: "The base depends heavily on a fully heated steel, stone, tray or pan.",
    pizza: "The hot floor sets the base quickly, but uneven floor heat can burn or pale one side.",
  },
  {
    title: "Topping moisture",
    icon: "water" as DoughToolsIconName,
    home: "Wet sauce, fresh cheese and heavy toppings have more time to soften the center.",
    pizza: "Moisture has little time to leave, so the topping layer must stay restrained.",
  },
  {
    title: "Bake time and workflow",
    icon: "timer" as DoughToolsIconName,
    home: "The slower pace is easier to repeat, but each pizza still removes surface heat.",
    pizza: "The bake is quick, so launching, turning and recovery need attention.",
  },
] as const;

const homeSurfaceNotes = [
  ["Steel", "Fast bottom heat and strong browning."],
  ["Stone", "Gentler heat transfer and masonry-like baking."],
  ["Pan", "Intentional longer-baked styles with oil and edge structure."],
] as const;

const mistakes = [
  {
    oven: "Home oven",
    title: "Base is pale or soft",
    sees: "The top looks done but the underside stays blond or bread-like.",
    reason: "The baking surface was not fully preheated, or the topping load was too wet for the bake.",
    change: "Preheat longer, use a hotter steel or stone setup, and reduce sauce or cheese moisture.",
  },
  {
    oven: "Home oven",
    title: "Top browns before the base",
    sees: "Cheese and rim color quickly while the underside lags behind.",
    reason: "Top heat is outrunning the surface underneath the dough.",
    change: "Let the surface recover, adjust rack position and avoid relying only on broiler heat.",
  },
  {
    oven: "Home oven",
    title: "Pizza dries during the bake",
    sees: "The crust turns tough before the base becomes satisfying.",
    reason: "A dough or topping setup built for high heat is spending too long in lower heat.",
    change: "Use a home-oven-friendly style, bake surface and topping balance instead of chasing pizza-oven color.",
  },
  {
    oven: "Pizza oven",
    title: "Scorched rim, undercooked center",
    sees: "The rim chars while the middle still looks wet or heavy.",
    reason: "The pizza is too close to strong flame, turned too slowly or topped too heavily.",
    change: "Launch into a balanced spot, turn sooner and keep sauce, cheese and toppings restrained.",
  },
  {
    oven: "Pizza oven",
    title: "Burnt base with pale top",
    sees: "The underside burns before the cheese and top crust finish.",
    reason: "Floor heat is outrunning top heat, or the launch area has a hot spot.",
    change: "Move to a cooler floor zone and rebalance flame, floor heat and turning rhythm.",
  },
  {
    oven: "Pizza oven",
    title: "Later pizzas bake worse",
    sees: "The first pizza works, then the next ones turn pale, soft or uneven.",
    reason: "The floor lost heat and did not recover between launches.",
    change: "Pause between pizzas when needed and judge the launch area, not just the visible flame.",
  },
] as const;

const decisionRows = [
  {
    title: "Choose Home oven when",
    items: [
      "you want repeatable indoor baking",
      "you make New York, pan, thin or longer-baked styles",
      "you prefer a slower workflow",
      "you use steel, stone, tray or pan",
    ],
  },
  {
    title: "Choose Pizza oven when",
    items: [
      "you want fast high-heat baking",
      "you want strong oven spring",
      "you make Neapolitan-style pizzas",
      "you are comfortable launching and turning quickly",
    ],
  },
] as const;

const safetyItems = [
  "Follow your equipment manufacturer’s instructions.",
  "Use outdoor-only ovens outdoors.",
  "Use stable, heat-resistant surfaces.",
  "Keep combustible materials clear.",
  "Let equipment cool before handling or storing.",
] as const;

export default function OvensPage() {
  return (
    <main className="min-h-screen bg-cream px-4 py-5 text-ink sm:px-6 sm:py-8">
      <div className="mx-auto max-w-7xl">
        <LearningBreadcrumbs current="Oven Guide" />
        <OvenGuideHero />

        <section className="mt-6 rounded-[1.5rem] border border-leaf/20 bg-leaf/10 p-4 sm:p-5" aria-labelledby="oven-product-truth-title">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 id="oven-product-truth-title" className="text-sm font-extrabold text-ink">What DoughTools currently uses</h2>
              <p className="mt-2 max-w-4xl text-sm leading-6 text-ink/65">{pizzaSessionOvenSupportSummary}</p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <OvenSupportBadge support="supported" note="Home oven" />
              <OvenSupportBadge support="supported" note="Pizza oven" />
            </div>
          </div>
        </section>

        <section id="oven-comparison" className="mt-8 scroll-mt-24" aria-labelledby="oven-comparison-title">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[.2em] text-tomato">Home oven vs Pizza oven</p>
              <h2 id="oven-comparison-title" className="mt-3 font-display text-3xl font-semibold sm:text-5xl">
                Two heat environments. Two different workflows.
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-6 text-ink/60">
              DoughTools uses broad oven categories on purpose. The goal is to match the bake rhythm to your real heat, not to rank equipment.
            </p>
          </div>

          <div className="mt-6 grid gap-5 lg:grid-cols-2">
            {ovenPaths.map((oven) => (
              <article key={oven.id} className={cardClass({ className: "p-5 sm:p-6", variant: oven.id === "pizza-oven" ? "dark" : "default" })}>
                <div className="flex items-start gap-4">
                  <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${oven.id === "pizza-oven" ? "bg-white/10 text-oven-gold" : "bg-tomato/10 text-tomato"}`} aria-hidden="true">
                    <DoughToolsIcon name={oven.icon} size={24} />
                  </span>
                  <div>
                    <h3 className="font-display text-3xl font-semibold">{oven.title}</h3>
                    <p className={`mt-2 text-sm leading-6 ${oven.id === "pizza-oven" ? "text-white/68" : "text-ink/62"}`}>{oven.summary}</p>
                  </div>
                </div>
                <ul className="mt-5 grid gap-2 text-sm leading-6">
                  {oven.strengths.map((item) => (
                    <li key={item} className="flex gap-2">
                      <DoughToolsIcon name="success" size={16} className={`mt-1 shrink-0 ${oven.id === "pizza-oven" ? "text-oven-gold" : "text-leaf"}`} />
                      <span className={oven.id === "pizza-oven" ? "text-white/72" : "text-ink/68"}>{item}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>

          <div className="mt-6 overflow-hidden rounded-[1.5rem] border border-ink/10 bg-white shadow-card" aria-labelledby="oven-quick-table-title">
            <h3 id="oven-quick-table-title" className="sr-only">Quick oven comparison</h3>
            <dl className="divide-y divide-ink/10">
              {comparisonRows.map(([label, home, pizza]) => (
                <div key={label} className="grid gap-3 p-4 sm:grid-cols-[10rem_minmax(0,1fr)_minmax(0,1fr)] sm:p-5">
                  <dt className="text-xs font-extrabold uppercase tracking-[.14em] text-ink/42">{label}</dt>
                  <dd className="text-sm leading-6 text-ink/66"><strong className="text-ink">Home oven:</strong> {home}</dd>
                  <dd className="text-sm leading-6 text-ink/66"><strong className="text-ink">Pizza oven:</strong> {pizza}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section className="mt-10 rounded-[2rem] border border-ink/10 bg-white/78 p-5 shadow-card sm:p-7" aria-labelledby="oven-changes-title">
          <p className="text-xs font-extrabold uppercase tracking-[.2em] text-tomato">What changes</p>
          <h2 id="oven-changes-title" className="mt-3 font-display text-3xl font-semibold sm:text-5xl">The oven changes the pizza before you change the recipe.</h2>
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {changeFactors.map((factor) => (
              <article key={factor.title} className="rounded-[1.35rem] border border-ink/10 bg-flour/70 p-4">
                <div className="flex items-start gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white text-tomato" aria-hidden="true">
                    <DoughToolsIcon name={factor.icon} size={20} />
                  </span>
                  <div>
                    <h3 className="text-base font-extrabold">{factor.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-ink/64"><strong>Home oven:</strong> {factor.home}</p>
                    <p className="mt-2 text-sm leading-6 text-ink/64"><strong>Pizza oven:</strong> {factor.pizza}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-10 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,.82fr)]" aria-labelledby="oven-setup-title">
          <article className={cardClass({ className: "p-5 sm:p-7", variant: "default" })}>
            <p className="text-xs font-extrabold uppercase tracking-[.2em] text-tomato">Setup and preheat</p>
            <h2 id="oven-setup-title" className="mt-3 font-display text-3xl font-semibold sm:text-5xl">Preheat the part that bakes the pizza.</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <section className="rounded-[1.25rem] border border-ink/10 bg-flour/70 p-4">
                <h3 className="text-base font-extrabold">Home oven</h3>
                <ul className="mt-3 grid gap-2 text-sm leading-6 text-ink/64">
                  <li>Preheat thoroughly at the highest safe setting.</li>
                  <li>Use steel, stone or pan according to the style.</li>
                  <li>Rack position changes top and bottom balance.</li>
                  <li>Broiler or grill assistance can help, but follow equipment instructions.</li>
                </ul>
              </section>
              <section className="rounded-[1.25rem] border border-ink/10 bg-forest-dark p-4 text-white">
                <h3 className="text-base font-extrabold">Pizza oven</h3>
                <ul className="mt-3 grid gap-2 text-sm leading-6 text-white/70">
                  <li>Heat the floor, not only the air or flame.</li>
                  <li>Check the launch area before loading.</li>
                  <li>Let the floor recover between pizzas.</li>
                  <li>Balance floor heat and flame while turning quickly.</li>
                </ul>
              </section>
            </div>
          </article>
          <aside className={cardClass({ className: "p-5 sm:p-6", variant: "information" })} aria-labelledby="home-surface-title">
            <h3 id="home-surface-title" className="font-display text-2xl font-semibold">Home-oven surfaces</h3>
            <dl className="mt-5 grid gap-3">
              {homeSurfaceNotes.map(([label, note]) => (
                <div key={label} className="rounded-[1.15rem] bg-white p-4">
                  <dt className="text-sm font-extrabold text-ink">{label}</dt>
                  <dd className="mt-1 text-sm leading-6 text-ink/62">{note}</dd>
                </div>
              ))}
            </dl>
          </aside>
        </section>

        <section id="common-oven-mistakes" className="mt-10 scroll-mt-24" aria-labelledby="common-oven-mistakes-title">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[.2em] text-tomato">Common mistakes</p>
              <h2 id="common-oven-mistakes-title" className="mt-3 font-display text-3xl font-semibold sm:text-5xl">
                Read the result, then adjust the heat path.
              </h2>
            </div>
            <Link href="/guide/pizza-troubleshooting" className={buttonClass({ className: "w-full sm:w-auto", variant: "secondary" })}>
              Open troubleshooting
            </Link>
          </div>
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {mistakes.map((mistake) => (
              <article key={`${mistake.oven}-${mistake.title}`} className={cardClass({ className: "p-5", variant: "default" })}>
                <p className="text-xs font-extrabold uppercase tracking-[.16em] text-tomato">{mistake.oven}</p>
                <h3 className="mt-2 font-display text-2xl font-semibold">{mistake.title}</h3>
                <div className="mt-4 grid gap-3 text-sm leading-6 text-ink/64">
                  <p><strong className="text-ink">What you see:</strong> {mistake.sees}</p>
                  <p><strong className="text-ink">Likely reason:</strong> {mistake.reason}</p>
                  <p><strong className="text-ink">What to change:</strong> {mistake.change}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-10 grid gap-5 lg:grid-cols-[minmax(0,.72fr)_minmax(0,1fr)]" aria-labelledby="oven-goal-title">
          <article className="rounded-[2rem] bg-forest-dark p-5 text-white shadow-raised sm:p-7">
            <p className="text-xs font-extrabold uppercase tracking-[.2em] text-oven-gold">Which one fits your goal?</p>
            <h2 id="oven-goal-title" className="mt-3 font-display text-3xl font-semibold sm:text-5xl">Choose by the pizza you want to make.</h2>
            <p className="mt-4 text-sm leading-7 text-white/70">
              This is educational guidance, not a new product selector. The Pizza Session still uses the same Home oven and Pizza oven choices.
            </p>
          </article>
          <div className="grid gap-4 sm:grid-cols-2">
            {decisionRows.map((row) => (
              <article key={row.title} className={cardClass({ className: "p-5", variant: "default" })}>
                <h3 className="text-base font-extrabold">{row.title}</h3>
                <ul className="mt-3 grid gap-2 text-sm leading-6 text-ink/64">
                  {row.items.map((item) => (
                    <li key={item} className="flex gap-2">
                      <DoughToolsIcon name="success" size={16} className="mt-1 shrink-0 text-leaf" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-10 rounded-[1.5rem] border border-tomato/15 bg-tomato/5 p-5" aria-labelledby="oven-safety-title">
          <h2 id="oven-safety-title" className="text-sm font-extrabold text-ink">Small safety note</h2>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
            {safetyItems.map((item) => (
              <li key={item} className="flex gap-2 text-sm leading-6 text-ink/64">
                <DoughToolsIcon name="warning" size={16} className="mt-1 shrink-0 text-tomato" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-10 rounded-[2rem] bg-forest-dark p-6 text-white shadow-raised sm:p-8" aria-labelledby="oven-final-cta-title">
          <p className="text-xs font-extrabold uppercase tracking-[.22em] text-oven-gold">Ready to plan</p>
          <h2 id="oven-final-cta-title" className="mt-3 font-display text-3xl font-semibold sm:text-5xl">
            Ready to plan for your oven?
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-white/70">
            Choose Home oven or Pizza oven in DoughTools and the plan will use the current oven guidance already supported by the product.
          </p>
          <div className="mt-6">
            <Link href="/session/start" className={buttonClass({ className: "w-full sm:w-auto", variant: "primary" })}>
              Plan my next pizza
            </Link>
          </div>
          <p className="mt-4 text-xs leading-5 text-white/52">
            For dough handling and topping load, continue with the <Link href="/guides/dough" className="font-bold text-oven-gold underline-offset-2 hover:underline">Dough Guide</Link> or the <Link href="/toppings" className="font-bold text-oven-gold underline-offset-2 hover:underline">Topping Balance Lab</Link>.
          </p>
        </section>
        <SiteFooter />
      </div>
    </main>
  );
}
