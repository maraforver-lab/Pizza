import type { Metadata } from "next";
import Link from "next/link";
import SiteFooter from "@/components/SiteFooter";
import { buttonClass, cardClass } from "@/components/design-system";
import { PracticalTipsLevelGuidance } from "@/components/guide/PracticalTipsLevelGuidance";
import { DoughToolsIcon, type DoughToolsIconName } from "@/components/icons";
import { LearningBreadcrumbs } from "@/components/learning/RelatedLearning";
import type { PracticalTipLevelGuidanceItem } from "@/lib/practical-tips-guidance";
import { metadataForRoute } from "@/lib/seo-config";

export const metadata: Metadata = metadataForRoute("/guide/practical-pizza-tips/containers-and-lids");

const containerBasics = [
  {
    title: "Cover the dough",
    body: "Use a clean container with a fitted lid, wrap or cover that prevents drying while the dough waits.",
    icon: "yeast",
  },
  {
    title: "Leave headspace",
    body: "Choose a container with room for expansion so the dough can rise without forcing the lid open.",
    icon: "restore",
  },
  {
    title: "Do not pressure-seal",
    body: "The lid protects moisture; it does not need to hold pressure or trap every bit of fermentation gas.",
    icon: "information",
  },
] as const satisfies readonly { title: string; body: string; icon: DoughToolsIconName }[];

const safetyChecks = [
  "Start with a clean container and clean hands or tools.",
  "Do not leave dough uncovered; exposed dough dries quickly and can form a tough skin.",
  "Keep long-waiting dough cold when the plan depends on refrigeration.",
  "Discard dough with mold, rotten smell, slime or signs it was held warm when it should have stayed cold.",
] as const;

const levelGuidance = [
  {
    level: "beginner",
    title: "Use a covered container with room",
    intro: "The best container is simple: clean, lightly oiled, covered and not packed to the top.",
    steps: [
      "Lightly oil the container and dough surface to reduce sticking and dry skin.",
      "Cover the dough as soon as it goes into the container.",
      "Leave enough headspace for the dough to expand during fermentation.",
      "Do not clamp the container to build pressure; the cover is there to prevent drying.",
      "If condensation forms, keep the dough covered and handle it gently when you remove it.",
    ],
  },
  {
    level: "enthusiast",
    title: "Control drying, sticking and temperature swings",
    intro: "Container size and cover style change dough texture because they affect moisture, expansion and heat transfer.",
    steps: [
      "A container that is too small can compress a rising dough; one that is much too large exposes more surface area to drying.",
      "A fitted lid usually prevents dry skin better than a loose towel, especially in the refrigerator.",
      "Condensation is normal when cold dough meets warmer air; wipe the lid if drips are pooling on the dough.",
      "If dough sticks badly, use a little more oil next time and release it with a scraper rather than tearing it.",
      "When dough warms quickly in a shallow container, watch for faster fermentation and move it colder if it races ahead.",
    ],
  },
  {
    level: "pizza_nerd",
    title: "Read headspace, humidity and gas expansion",
    intro: "A dough container is a small fermentation environment, not just storage.",
    steps: [
      "Headspace gives expanding gas somewhere to go without flattening the dough against the lid.",
      "A covered container raises local humidity, which slows skin formation but can add condensation when temperatures change.",
      "A pressure-tight setup is unnecessary because pizza dough fermentation does not need trapped pressure to work.",
      "Sticking often combines surface hydration, gluten state, oil coverage and how much gas was lost during removal.",
      "Track container volume, dough temperature and expansion together when comparing fermentation results.",
    ],
  },
] as const satisfies readonly PracticalTipLevelGuidanceItem[];

export default function ContainersAndLidsTipPage() {
  return (
    <main className="min-h-screen overflow-x-clip bg-warm-background text-ink">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
        <LearningBreadcrumbs current="Dough container and lid use" />

        <section className="mt-5 rounded-[2rem] border border-white/80 bg-white/80 p-6 shadow-card sm:p-8 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(18rem,.42fr)] lg:items-end lg:gap-8">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[.22em] text-tomato">Practical pizza tips</p>
            <h1 className="mt-3 max-w-4xl font-display text-4xl font-semibold leading-[.96] sm:text-6xl">
              Dough container and lid use
            </h1>
            <p className="mt-4 max-w-2xl text-base font-bold leading-8 text-ink/64">
              Keep dough covered, hydrated and able to expand without turning the container into a pressure vessel.
            </p>
          </div>
          <div className="mt-6 rounded-[1.5rem] border border-tomato/15 bg-tomato/[.06] p-5 lg:mt-0">
            <p className="text-xs font-extrabold uppercase tracking-[.18em] text-tomato">Quick rule</p>
            <p className="mt-2 text-sm font-bold leading-6 text-ink/64">
              Covered prevents drying. Headspace allows expansion. Pressure sealing is not required.
            </p>
          </div>
        </section>

        <section className="mt-8" aria-labelledby="container-basics-title">
          <div className="max-w-3xl">
            <p className="text-xs font-extrabold uppercase tracking-[.2em] text-tomato">Container basics</p>
            <h2 id="container-basics-title" className="mt-3 font-display text-3xl font-semibold sm:text-4xl">
              Protect the dough without trapping it.
            </h2>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {containerBasics.map((item) => (
              <article key={item.title} className={cardClass({ className: "p-5", variant: "default" })}>
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-tomato/10 text-tomato ring-1 ring-tomato/15" aria-hidden="true">
                  <DoughToolsIcon name={item.icon} size={20} />
                </span>
                <h3 className="mt-4 font-display text-2xl font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-ink/62">{item.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-8 grid gap-5 lg:grid-cols-[minmax(0,.68fr)_minmax(0,1fr)]" aria-labelledby="container-safety-title">
          <aside className={cardClass({ className: "p-5 sm:p-6", variant: "information" })}>
            <p className="text-xs font-extrabold uppercase tracking-[.2em] text-tomato">Always visible</p>
            <h2 id="container-safety-title" className="mt-3 font-display text-3xl font-semibold">
              Clean and covered comes first.
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

          <PracticalTipsLevelGuidance ariaLabel="Container and lid guidance by selected experience level" items={levelGuidance} />
        </section>

        <section className="mt-8 rounded-[2rem] bg-tomato p-6 text-white shadow-card sm:p-8 lg:grid lg:grid-cols-[1fr_auto] lg:items-center lg:gap-8">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[.2em] text-white/70">Related tip</p>
            <h2 className="mt-3 font-display text-3xl font-semibold sm:text-5xl">Diagnose the dough problem next.</h2>
          </div>
          <Link href="/guide/practical-pizza-tips/common-problems" className={buttonClass({ className: "mt-6 w-full bg-white text-tomato hover:bg-flour sm:w-auto lg:mt-0" })}>
            Explore guide
          </Link>
        </section>

        <SiteFooter />
      </div>
    </main>
  );
}
