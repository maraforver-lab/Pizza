import type { Metadata } from "next";
import Link from "next/link";
import SiteFooter from "@/components/SiteFooter";
import { buttonClass, cardClass } from "@/components/design-system";
import { PracticalTipsLevelGuidance } from "@/components/guide/PracticalTipsLevelGuidance";
import { DoughToolsIcon, type DoughToolsIconName } from "@/components/icons";
import { LearningBreadcrumbs } from "@/components/learning/RelatedLearning";
import type { PracticalTipLevelGuidanceItem } from "@/lib/practical-tips-guidance";
import { metadataForRoute } from "@/lib/seo-config";

export const metadata: Metadata = metadataForRoute("/guide/practical-pizza-tips/leftover-dough");

const quickDecisions = [
  {
    title: "Use it soon",
    body: "Refrigerate the dough in a lightly oiled, covered container so it stays cold, protected and ready for a later bake.",
    icon: "refrigerator",
  },
  {
    title: "Use it later",
    body: "Freeze the dough before it is badly overproofed, then thaw it covered in the refrigerator before warming it for stretching.",
    icon: "timer",
  },
  {
    title: "When in doubt",
    body: "Discard dough with mold, an unsafe warm hold, a rotten smell, slime or a badly dried crust with colored spots.",
    icon: "warning",
  },
] as const satisfies readonly { title: string; body: string; icon: DoughToolsIconName }[];

const safetyChecks = [
  "Keep leftover dough covered and cold whenever it is waiting.",
  "Use a clean, lightly oiled container with enough room for the dough to expand.",
  "Thaw frozen dough in the refrigerator first, then let it warm and relax before stretching.",
  "Discard dough that shows mold, smells rotten, feels slimy or was held warm when it should have been cold.",
] as const;

const levelGuidance = [
  {
    level: "beginner",
    title: "Safe starting action",
    intro: "If you will use the dough soon, refrigerate it. If plans move further away, freeze it.",
    steps: [
      "Lightly oil the dough ball and container so the surface does not dry out.",
      "Cover the container with a fitted lid or wrap before refrigerating or freezing.",
      "Move frozen dough to the refrigerator to thaw, still covered.",
      "Before baking, let chilled dough warm up and relax until it stretches without snapping back hard.",
      "Throw it away if you see mold, strong rotten smells, slime or signs that it sat warm for too long.",
    ],
  },
  {
    level: "enthusiast",
    title: "Storage timing and recovery",
    intro: "Freeze dough when it is portioned and developed, but before it has spent too long in final proof.",
    steps: [
      "Portion dough before freezing so each container or bag holds one pizza.",
      "Label each portion with the date, dough weight, style and whether it was chilled, frozen or close to ready.",
      "Restore chilled or thawed dough covered; give tight dough more time to relax and handle weak dough gently.",
      "Under-fermented dough feels dense and tight with little gas; over-fermented dough feels slack, fragile and collapses easily.",
      "If the surface dries, trim a small leathery patch only when the rest of the dough still smells and feels safe.",
    ],
  },
  {
    level: "pizza_nerd",
    title: "What storage changes inside the dough",
    intro: "Cold storage slows fermentation; it does not stop it completely.",
    steps: [
      "Yeast keeps working while the dough cools and wakes again during thawing, so dough temperature affects the real fermentation path.",
      "Long storage weakens gluten and reduces gas retention, which can make a dough feel extensible but fragile.",
      "Freezing can damage some yeast cells and ice can disrupt the gluten network, so expect less spring from older frozen dough.",
      "Container headspace matters: too little room can compress gas, while too much exposed air can dry the surface.",
      "Track dough temperature, storage time and expansion together instead of treating storage as a fixed countdown.",
    ],
  },
] as const satisfies readonly PracticalTipLevelGuidanceItem[];

export default function LeftoverDoughTipPage() {
  return (
    <main className="min-h-screen overflow-x-clip bg-warm-background text-ink">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
        <LearningBreadcrumbs current="Leftover dough" />

        <section className="mt-5 rounded-[2rem] border border-white/80 bg-white/80 p-6 shadow-card sm:p-8 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(18rem,.42fr)] lg:items-end lg:gap-8">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[.22em] text-tomato">Practical pizza tips</p>
            <h1 className="mt-3 max-w-4xl font-display text-4xl font-semibold leading-[.96] sm:text-6xl">
              Leftover dough
            </h1>
            <p className="mt-4 max-w-2xl text-base font-bold leading-8 text-ink/64">
              Store, freeze, thaw and safely use dough when the pizza plan changes.
            </p>
          </div>
          <div className="mt-6 rounded-[1.5rem] border border-tomato/15 bg-tomato/[.06] p-5 lg:mt-0">
            <p className="text-xs font-extrabold uppercase tracking-[.18em] text-tomato">Quick rule</p>
            <p className="mt-2 text-sm font-bold leading-6 text-ink/64">
              Keep waiting dough cold, covered and clean. Warm it only when you are preparing to stretch and bake.
            </p>
          </div>
        </section>

        <section className="mt-8" aria-labelledby="leftover-dough-decisions-title">
          <div className="max-w-3xl">
            <p className="text-xs font-extrabold uppercase tracking-[.2em] text-tomato">First decision</p>
            <h2 id="leftover-dough-decisions-title" className="mt-3 font-display text-3xl font-semibold sm:text-4xl">
              Decide whether to chill, freeze or discard.
            </h2>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {quickDecisions.map((decision) => (
              <article key={decision.title} className={cardClass({ className: "p-5", variant: "default" })}>
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-tomato/10 text-tomato ring-1 ring-tomato/15" aria-hidden="true">
                  <DoughToolsIcon name={decision.icon} size={20} />
                </span>
                <h3 className="mt-4 font-display text-2xl font-semibold">{decision.title}</h3>
                <p className="mt-2 text-sm leading-6 text-ink/62">{decision.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-8 grid gap-5 lg:grid-cols-[minmax(0,.68fr)_minmax(0,1fr)]" aria-labelledby="leftover-dough-safety-title">
          <aside className={cardClass({ className: "p-5 sm:p-6", variant: "information" })}>
            <p className="text-xs font-extrabold uppercase tracking-[.2em] text-tomato">Always visible</p>
            <h2 id="leftover-dough-safety-title" className="mt-3 font-display text-3xl font-semibold">
              Food-safety checks come first.
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

          <PracticalTipsLevelGuidance ariaLabel="Leftover dough guidance by selected experience level" items={levelGuidance} />
        </section>

        <section className="mt-8 rounded-[2rem] bg-tomato p-6 text-white shadow-card sm:p-8 lg:grid lg:grid-cols-[1fr_auto] lg:items-center lg:gap-8">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[.2em] text-white/70">Next practical tip</p>
            <h2 className="mt-3 font-display text-3xl font-semibold sm:text-5xl">Return to Practical pizza tips.</h2>
          </div>
          <Link
            href="/guide/practical-pizza-tips"
            className={buttonClass({ className: "mt-6 w-full bg-white text-tomato hover:bg-flour sm:w-auto lg:mt-0" })}
          >
            See all practical tips
          </Link>
        </section>

        <SiteFooter />
      </div>
    </main>
  );
}
