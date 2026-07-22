import type { Metadata } from "next";
import Link from "next/link";
import SiteFooter from "@/components/SiteFooter";
import { buttonClass, cardClass, cx } from "@/components/design-system";
import { DoughToolsIcon, type DoughToolsIconName } from "@/components/icons";
import { LearningBreadcrumbs } from "@/components/learning/RelatedLearning";
import {
  EXPERIENCE_LEVELS,
  getExperienceLevelCornerAccentStyle,
  type ExperienceLevel,
} from "@/lib/experience-levels";
import { metadataForRoute } from "@/lib/seo-config";

export const metadata: Metadata = metadataForRoute("/guide/practical-pizza-tips/fermentation-length");

const fermentationOptions = [
  {
    label: "12 hours",
    title: "Same-day or overnight control",
    body: "A practical choice when you need dough soon, have warmer conditions or want a simpler schedule with less risk of gluten weakening.",
    icon: "clock",
  },
  {
    label: "24 hours",
    title: "Easy default for most home bakers",
    body: "A safe starting point for many pizza plans because it gives more flavor than a short dough without demanding very strong flour.",
    icon: "timer",
  },
  {
    label: "48 hours",
    title: "More flavor with more conditions",
    body: "Useful when the dough is kept cold, the flour can handle the wait and your schedule gives the dough time to warm before baking.",
    icon: "refrigerator",
  },
  {
    label: "72 hours",
    title: "Advanced long fermentation",
    body: "Best treated as an intentional plan for strong flour, cold storage and careful dough handling, not an automatic upgrade.",
    icon: "thermometer",
  },
] as const satisfies readonly { label: string; title: string; body: string; icon: DoughToolsIconName }[];

const safetyChecks = [
  "Keep long-waiting dough covered and cold when the plan depends on refrigeration.",
  "Do not judge dough readiness by hours alone; check expansion, strength, smell and handling feel.",
  "Discard dough with mold, rotten smell, slime or signs it was held warm when it should have stayed cold.",
  "Shorten the plan if the dough is racing ahead; extend only when the dough still has strength and safe storage.",
] as const;

const levelGuidance = [
  {
    level: "beginner",
    title: "Choose the simplest safe plan",
    intro: "Start with 24 hours for an ordinary home bake unless your schedule clearly needs something shorter or longer.",
    steps: [
      "Choose 12 hours when you need dough today or tomorrow and want fewer moving parts.",
      "Choose 24 hours as the default when you want better flavor without a difficult long-fermentation plan.",
      "Choose 48 hours only when the dough can stay cold and you have time to warm it before stretching.",
      "Choose 72 hours only when you have strong flour, reliable cold storage and a reason to manage a longer dough.",
      "Longer fermentation is not automatically better; flour strength, temperature and your schedule matter more.",
    ],
  },
  {
    level: "enthusiast",
    title: "Match flavor, strength and schedule",
    intro: "Longer cold fermentation can build flavor and extensibility, but it also asks more from the flour and storage temperature.",
    steps: [
      "Room-temperature fermentation moves faster and needs tighter timing; cold fermentation gives more schedule control.",
      "Stronger flour usually tolerates 48 or 72 hours better than weak flour, especially when the dough is highly hydrated.",
      "A warmer refrigerator can make a long plan behave like a shorter, faster plan, so watch the dough instead of trusting the label.",
      "If dough is swelling fast, smells sharp and feels slack, shorten the plan or bake sooner.",
      "If dough is dense, tight and barely expanded, extend the plan or give it more warm relaxation before shaping.",
    ],
  },
  {
    level: "pizza_nerd",
    title: "Read the time-temperature-yeast system",
    intro: "Nominal hours are only a planning label; readiness comes from yeast activity, dough temperature and flour behavior together.",
    steps: [
      "Yeast quantity, dough temperature and storage temperature control gas production more than the number printed on the plan.",
      "Proteolysis can improve extensibility at first, then weaken gluten and reduce handling tolerance during very long fermentation.",
      "Gas retention depends on gluten quality, fermentation speed and handling; a dough can produce gas yet fail to hold it well.",
      "Combined room and cold fermentation changes the curve because early warm time can make a long cold plan mature much faster.",
      "Long fermentation risks include gluten weakening, excessive acidity, collapsed structure and a dough that stretches easily but bakes flat.",
    ],
  },
] as const satisfies readonly {
  level: ExperienceLevel;
  title: string;
  intro: string;
  steps: readonly string[];
}[];

function LevelGuidanceCard({ item }: { item: (typeof levelGuidance)[number] }) {
  const level = EXPERIENCE_LEVELS.find((candidate) => candidate.id === item.level) ?? EXPERIENCE_LEVELS[0];

  return (
    <article
      className={cx("rounded-[1.5rem] border p-5 shadow-soft", level.cardClassName)}
      style={getExperienceLevelCornerAccentStyle(level.id)}
    >
      <p className="text-xs font-extrabold uppercase tracking-[.18em] text-ink/45">{level.label}</p>
      <h3 className="mt-3 font-display text-2xl font-semibold text-ink">{item.title}</h3>
      <p className="mt-3 text-sm font-bold leading-6 text-ink/66">{item.intro}</p>
      <ul className="mt-4 grid gap-3 text-sm leading-6 text-ink/66">
        {item.steps.map((step) => (
          <li key={step} className="flex gap-2">
            <DoughToolsIcon name="success" size={16} className="mt-1 shrink-0 text-leaf" />
            <span>{step}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}

export default function FermentationLengthTipPage() {
  return (
    <main className="min-h-screen overflow-x-clip bg-warm-background text-ink">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
        <LearningBreadcrumbs current="Choosing fermentation length" />

        <section className="mt-5 rounded-[2rem] border border-white/80 bg-white/80 p-6 shadow-card sm:p-8 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(18rem,.42fr)] lg:items-end lg:gap-8">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[.22em] text-tomato">Practical pizza tips</p>
            <h1 className="mt-3 max-w-4xl font-display text-4xl font-semibold leading-[.96] sm:text-6xl">
              Choosing fermentation length
            </h1>
            <p className="mt-4 max-w-2xl text-base font-bold leading-8 text-ink/64">
              Compare 12, 24, 48 and 72 hour dough plans without treating the clock as a guarantee.
            </p>
          </div>
          <div className="mt-6 rounded-[1.5rem] border border-tomato/15 bg-tomato/[.06] p-5 lg:mt-0">
            <p className="text-xs font-extrabold uppercase tracking-[.18em] text-tomato">Quick rule</p>
            <p className="mt-2 text-sm font-bold leading-6 text-ink/64">
              For a normal home bake, start with 24 hours unless your flour, temperature or schedule makes a shorter or longer plan safer.
            </p>
          </div>
        </section>

        <section className="mt-8" aria-labelledby="fermentation-options-title">
          <div className="max-w-3xl">
            <p className="text-xs font-extrabold uppercase tracking-[.2em] text-tomato">Compare the options</p>
            <h2 id="fermentation-options-title" className="mt-3 font-display text-3xl font-semibold sm:text-4xl">
              12, 24, 48 and 72 hours mean different trade-offs.
            </h2>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {fermentationOptions.map((option) => (
              <article key={option.label} className={cardClass({ className: "p-5", variant: "default" })}>
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-tomato/10 text-tomato ring-1 ring-tomato/15" aria-hidden="true">
                  <DoughToolsIcon name={option.icon} size={20} />
                </span>
                <p className="mt-4 text-xs font-extrabold uppercase tracking-[.18em] text-tomato">{option.label}</p>
                <h3 className="mt-2 font-display text-2xl font-semibold">{option.title}</h3>
                <p className="mt-2 text-sm leading-6 text-ink/62">{option.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-8 grid gap-5 lg:grid-cols-[minmax(0,.68fr)_minmax(0,1fr)]" aria-labelledby="fermentation-safety-title">
          <aside className={cardClass({ className: "p-5 sm:p-6", variant: "information" })}>
            <p className="text-xs font-extrabold uppercase tracking-[.2em] text-tomato">Always visible</p>
            <h2 id="fermentation-safety-title" className="mt-3 font-display text-3xl font-semibold">
              Dough condition matters more than the clock.
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

          <div className="grid gap-4" aria-label="Fermentation length guidance by experience level">
            {levelGuidance.map((item) => (
              <LevelGuidanceCard key={item.level} item={item} />
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-[2rem] bg-tomato p-6 text-white shadow-card sm:p-8 lg:grid lg:grid-cols-[1fr_auto] lg:items-center lg:gap-8">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[.2em] text-white/70">Back to tips</p>
            <h2 className="mt-3 font-display text-3xl font-semibold sm:text-5xl">Keep the next decision practical.</h2>
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
