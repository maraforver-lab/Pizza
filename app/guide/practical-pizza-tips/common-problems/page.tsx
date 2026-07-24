import type { Metadata } from "next";
import Link from "next/link";
import SiteFooter from "@/components/SiteFooter";
import { buttonClass, cardClass } from "@/components/design-system";
import { PracticalTipsLevelGuidance } from "@/components/guide/PracticalTipsLevelGuidance";
import { DoughToolsIcon, type DoughToolsIconName } from "@/components/icons";
import { LearningBreadcrumbs } from "@/components/learning/RelatedLearning";
import type { PracticalTipLevelGuidanceItem } from "@/lib/practical-tips-guidance";
import { metadataForRoute } from "@/lib/seo-config";

export const metadata: Metadata = metadataForRoute("/guide/practical-pizza-tips/common-problems");

const quickFixes = [
  ["Dough too sticky", "Oil your hands lightly, use a scraper and avoid adding lots of flour at the end."],
  ["Dough too tight", "Cover it and let it relax before stretching again."],
  ["Dough spread flat", "Handle it gently, bake sooner next time and check whether it over-fermented."],
  ["Dry skin on dough", "Keep it covered; trim a small leathery patch only if the rest is safe."],
  ["Sauce too watery", "Use less sauce, drain watery tomatoes or cook the sauce briefly."],
  ["Pale top", "Move the bake higher or finish briefly with grill or broiler when safe."],
  ["Burnt base", "Move lower, reduce bottom heat or use a less aggressive baking surface."],
  ["Wet toppings", "Use fewer wet toppings, drain them or add delicate toppings after baking."],
] as const;

const safetyChecks = [
  "Discard dough, sauce or toppings with mold, rotten smell, slime or unsafe warm holding.",
  "Use grill, broiler, stone, steel and hot pans only according to your appliance and equipment safety guidance.",
  "Treat burnt food and smoke as a heat-balance warning, not just a timing problem.",
  "Use the full troubleshooting guide when the same problem keeps returning.",
] as const;

const diagnosisAreas = [
  {
    title: "Dough problems",
    body: "Sticky, tight, flat or dry dough usually points to hydration, fermentation state, handling or container exposure.",
    icon: "mixing-bowl",
  },
  {
    title: "Sauce and toppings",
    body: "Watery sauce and wet toppings add bake load, slow browning and can leave the center soft.",
    icon: "shopping-basket",
  },
  {
    title: "Baking balance",
    body: "Pale tops and burnt bases come from top-to-bottom heat balance, rack position and baking surface behavior.",
    icon: "oven",
  },
] as const satisfies readonly { title: string; body: string; icon: DoughToolsIconName }[];

const levelGuidance = [
  {
    level: "beginner",
    title: "Start with the safest direct fix",
    intro: "Fix the current pizza with a small action, then adjust one thing next time.",
    steps: [
      "Sticky dough: oil hands lightly, use a scraper and avoid burying the dough in flour.",
      "Tight dough: cover it and rest it until it relaxes.",
      "Flat dough or dry skin: handle gently, keep dough covered and bake sooner next time if it was over-ready.",
      "Watery sauce or toppings: use less, drain more or choose drier toppings.",
      "Pale top or burnt base: adjust rack position and use grill or broiler only briefly and safely.",
    ],
  },
  {
    level: "enthusiast",
    title: "Diagnose by what changed first",
    intro: "Most repeated problems come from fermentation pace, container conditions, sauce moisture or heat balance.",
    steps: [
      "Under-fermented dough is dense and tight; over-fermented dough is slack, fragile and can spread flat.",
      "Container size, lid fit and temperature changes can cause drying, condensation, sticking or faster fermentation.",
      "Correct sauce moisture by draining watery tomatoes, reducing sauce quantity or briefly cooking only when the style allows it.",
      "Balance top and bottom heat by changing rack height, baking surface, preheat readiness or a short grill finish.",
      "Adjust topping quantity when the center stays wet, especially with mushrooms, fresh tomato, wet mozzarella or heavy sauce.",
    ],
  },
  {
    level: "pizza_nerd",
    title: "Trace the problem to the process stage",
    intro: "A symptom is easier to fix when you know whether it came from formula, fermentation, topping load or heat transfer.",
    steps: [
      "Gluten strength and fermentation state control whether dough stretches, tears, collapses or springs in the oven.",
      "Headspace and humidity inside the container affect gas expansion, surface drying and how much dough sticks during release.",
      "Sauce water activity and total topping mass change evaporative load, browning speed and center-set time.",
      "Top-to-bottom heat balance decides whether the base finishes before the rim and cheese have enough color.",
      "Diagnose by stage: mix, ferment, store, open, top, launch and bake instead of changing every variable at once.",
    ],
  },
] as const satisfies readonly PracticalTipLevelGuidanceItem[];

export default function CommonProblemsTipPage() {
  return (
    <main className="min-h-screen overflow-x-clip bg-warm-background text-ink">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
        <LearningBreadcrumbs current="Common problems" />

        <section className="mt-5 rounded-[2rem] border border-white/80 bg-white/80 p-6 shadow-card sm:p-8 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(18rem,.42fr)] lg:items-end lg:gap-8">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[.22em] text-tomato">Practical pizza tips</p>
            <h1 className="mt-3 max-w-4xl font-display text-4xl font-semibold leading-[.96] sm:text-6xl">
              Common dough, sauce and baking problems
            </h1>
            <p className="mt-4 max-w-2xl text-base font-bold leading-8 text-ink/64">
              Quick fixes for sticky dough, watery sauce, pale tops, burnt bases and wet toppings.
            </p>
          </div>
          <div className="mt-6 rounded-[1.5rem] border border-tomato/15 bg-tomato/[.06] p-5 lg:mt-0">
            <p className="text-xs font-extrabold uppercase tracking-[.18em] text-tomato">Quick rule</p>
            <p className="mt-2 text-sm font-bold leading-6 text-ink/64">
              Fix one likely cause at a time. If the same symptom repeats, use the full troubleshooting guide.
            </p>
          </div>
        </section>

        <section className="mt-8" aria-labelledby="quick-fixes-title">
          <div className="max-w-3xl">
            <p className="text-xs font-extrabold uppercase tracking-[.2em] text-tomato">Problem to action</p>
            <h2 id="quick-fixes-title" className="mt-3 font-display text-3xl font-semibold sm:text-4xl">
              Quick fixes for the current pizza.
            </h2>
          </div>
          <div className="mt-6 grid gap-3 md:grid-cols-2">
            {quickFixes.map(([problem, action]) => (
              <article key={problem} className={cardClass({ className: "p-4", variant: "default" })}>
                <h3 className="font-display text-xl font-semibold">{problem}</h3>
                <p className="mt-2 text-sm leading-6 text-ink/62">{action}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-8" aria-labelledby="diagnosis-areas-title">
          <div className="max-w-3xl">
            <p className="text-xs font-extrabold uppercase tracking-[.2em] text-tomato">What to diagnose</p>
            <h2 id="diagnosis-areas-title" className="mt-3 font-display text-3xl font-semibold sm:text-4xl">
              Repeated problems usually come from one process area.
            </h2>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {diagnosisAreas.map((area) => (
              <article key={area.title} className={cardClass({ className: "p-5", variant: "default" })}>
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-tomato/10 text-tomato ring-1 ring-tomato/15" aria-hidden="true">
                  <DoughToolsIcon name={area.icon} size={20} />
                </span>
                <h3 className="mt-4 font-display text-2xl font-semibold">{area.title}</h3>
                <p className="mt-2 text-sm leading-6 text-ink/62">{area.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-8 grid gap-5 lg:grid-cols-[minmax(0,.68fr)_minmax(0,1fr)]" aria-labelledby="common-problems-safety-title">
          <aside className={cardClass({ className: "p-5 sm:p-6", variant: "information" })}>
            <p className="text-xs font-extrabold uppercase tracking-[.2em] text-tomato">Always visible</p>
            <h2 id="common-problems-safety-title" className="mt-3 font-display text-3xl font-semibold">
              Safety beats saving a bad batch.
            </h2>
            <ul className="mt-5 grid gap-3 text-sm leading-6 text-ink/66">
              {safetyChecks.map((check) => (
                <li key={check} className="flex gap-2">
                  <DoughToolsIcon name="success" size={16} className="mt-1 shrink-0 text-leaf" />
                  <span>{check}</span>
                </li>
              ))}
            </ul>
          </aside>

          <PracticalTipsLevelGuidance ariaLabel="Common problem guidance by selected experience level" items={levelGuidance} />
        </section>

        <section className="mt-8 rounded-[2rem] bg-tomato p-6 text-white shadow-card sm:p-8 lg:grid lg:grid-cols-[1fr_auto] lg:items-center lg:gap-8">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[.2em] text-white/70">Need deeper diagnosis?</p>
            <h2 className="mt-3 font-display text-3xl font-semibold sm:text-5xl">Use the full troubleshooting guide.</h2>
          </div>
          <Link href="/guide/pizza-troubleshooting" className={buttonClass({ className: "mt-6 w-full bg-white text-tomato hover:bg-flour sm:w-auto lg:mt-0" })}>
            Fix pizza problems
          </Link>
        </section>

        <SiteFooter />
      </div>
    </main>
  );
}
