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

export const metadata: Metadata = metadataForRoute("/guide/practical-pizza-tips");

type PracticalPizzaTipTopic = {
  title: string;
  description: string;
  plannedPatch: "452B" | "452C" | "452D";
  icon: DoughToolsIconName;
  href?: string;
};

const plannedTopics = [
  {
    title: "Leftover dough",
    description: "Store, freeze, thaw and safely use dough when pizza night changes.",
    plannedPatch: "452B",
    icon: "mixing-bowl",
    href: "/guide/practical-pizza-tips/leftover-dough",
  },
  {
    title: "Freezing and thawing",
    description: "How to freeze dough safely and bring it back without guessing.",
    plannedPatch: "452B",
    icon: "refrigerator",
    href: "/guide/practical-pizza-tips/leftover-dough",
  },
  {
    title: "Choosing fermentation length",
    description: "How to choose a practical dough timeline for the time you have.",
    plannedPatch: "452C",
    icon: "timer",
    href: "/guide/practical-pizza-tips/fermentation-length",
  },
  {
    title: "Dough container and lid use",
    description: "How container size, lid fit and surface drying affect dough handling.",
    plannedPatch: "452C",
    icon: "yeast",
    href: undefined,
  },
  {
    title: "Common dough, sauce and baking problems",
    description: "How to decide whether a problem came from formula, timing, toppings or heat.",
    plannedPatch: "452D",
    icon: "warning",
    href: undefined,
  },
] as const satisfies readonly PracticalPizzaTipTopic[];

const practicalTipLevelPattern = [
  {
    level: "beginner",
    title: "Direct answer and safe starting action",
    body: "Start with the safest next step, plain language and a small action that will not make the dough or bake worse.",
  },
  {
    level: "enthusiast",
    title: "Practical adjustments and common exceptions",
    body: "Add the most useful trade-offs, what to adjust first and the everyday exceptions that change the recommendation.",
  },
  {
    level: "pizza_nerd",
    title: "Technical explanation and fine-tuning",
    body: "Explain the mechanism briefly, name the variable that matters and show how to tune the next attempt without turning the tip into a full article.",
  },
] as const satisfies readonly { level: ExperienceLevel; title: string; body: string }[];

const safetyPrinciples = [
  "Keep food-safety guidance visible to every experience level.",
  "Use cold storage for dough that needs to wait.",
  "Discard dough or toppings that smell wrong, show mold or have been held unsafely.",
  "Follow your appliance manual when using grill, broiler, stone, steel or high heat.",
] as const;

function LevelPatternCard({ item }: { item: (typeof practicalTipLevelPattern)[number] }) {
  const level = EXPERIENCE_LEVELS.find((candidate) => candidate.id === item.level) ?? EXPERIENCE_LEVELS[0];

  return (
    <article
      className={cx("rounded-[1.5rem] border p-5 shadow-soft", level.cardClassName)}
      style={getExperienceLevelCornerAccentStyle(level.id)}
    >
      <p className="text-xs font-extrabold uppercase tracking-[.18em] text-ink/45">{level.label}</p>
      <h3 className="mt-3 font-display text-2xl font-semibold text-ink">{item.title}</h3>
      <p className="mt-3 text-sm font-bold leading-6 text-ink/64">{item.body}</p>
    </article>
  );
}

export default function PracticalPizzaTipsPage() {
  return (
    <main className="min-h-screen overflow-x-clip bg-warm-background text-ink">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
        <LearningBreadcrumbs current="Practical pizza tips" />

        <section className="mt-5 rounded-[2rem] border border-white/80 bg-white/80 p-6 shadow-card sm:p-8 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(18rem,.42fr)] lg:items-end lg:gap-8">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[.22em] text-tomato">Pizza guides</p>
            <h1 className="mt-3 max-w-4xl font-display text-4xl font-semibold leading-[.96] sm:text-6xl">
              Practical pizza tips
            </h1>
            <p className="mt-4 max-w-2xl text-base font-bold leading-8 text-ink/64">
              Short practical guides for the moments around a pizza plan: leftover dough, freezing, fermentation timing, containers and common problems.
            </p>
          </div>
          <div className="mt-6 rounded-[1.5rem] border border-tomato/15 bg-tomato/[.06] p-5 lg:mt-0">
            <p className="text-xs font-extrabold uppercase tracking-[.18em] text-tomato">Structure</p>
            <p className="mt-2 text-sm font-bold leading-6 text-ink/64">
              Each future tip will use the same Beginner, Enthusiast and Pizza Nerd pattern while keeping essential safety guidance visible to everyone.
            </p>
          </div>
        </section>

        <section className="mt-8" aria-labelledby="planned-practical-tips-title">
          <div className="max-w-3xl">
            <p className="text-xs font-extrabold uppercase tracking-[.2em] text-tomato">Upcoming topics</p>
            <h2 id="planned-practical-tips-title" className="mt-3 font-display text-3xl font-semibold sm:text-4xl">
              Small decisions that make the next pizza easier.
            </h2>
            <p className="mt-3 text-sm leading-6 text-ink/62">
              Start with leftover dough guidance now. The remaining focused tip articles are planned next.
            </p>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {plannedTopics.map((topic) => {
              const content = (
                <>
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-tomato/10 text-tomato ring-1 ring-tomato/15" aria-hidden="true">
                    <DoughToolsIcon name={topic.icon} size={20} />
                  </span>
                  <h3 className="mt-4 font-display text-2xl font-semibold">{topic.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-ink/62">{topic.description}</p>
                  <p className="mt-4 text-xs font-extrabold uppercase tracking-[.16em] text-ink/42">
                    {topic.href ? "Open practical tip" : `Planned for Patch ${topic.plannedPatch}`}
                  </p>
                </>
              );

              return topic.href ? (
                <Link
                  key={topic.title}
                  href={topic.href}
                  className={cardClass({ className: "block p-5 transition hover:-translate-y-0.5 hover:border-tomato/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2", variant: "default" })}
                >
                  {content}
                </Link>
              ) : (
                <article key={topic.title} className={cardClass({ className: "p-5", variant: "default" })}>
                  {content}
                </article>
              );
            })}
          </div>
        </section>

        <section className="mt-8 grid gap-5 lg:grid-cols-[minmax(0,.74fr)_minmax(0,1fr)]" aria-labelledby="tip-level-pattern-title">
          <aside className={cardClass({ className: "p-5 sm:p-6", variant: "information" })}>
            <p className="text-xs font-extrabold uppercase tracking-[.2em] text-tomato">Always visible</p>
            <h2 id="tip-level-pattern-title" className="mt-3 font-display text-3xl font-semibold">
              Safety does not hide behind experience level.
            </h2>
            <ul className="mt-5 grid gap-3 text-sm leading-6 text-ink/66">
              {safetyPrinciples.map((principle) => (
                <li key={principle} className="flex gap-2">
                  <DoughToolsIcon name="success" size={16} className="mt-1 shrink-0 text-leaf" />
                  <span>{principle}</span>
                </li>
              ))}
            </ul>
          </aside>

          <div className="grid gap-4" aria-label="Practical pizza tips level pattern">
            {practicalTipLevelPattern.map((item) => (
              <LevelPatternCard key={item.level} item={item} />
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-[2rem] bg-tomato p-6 text-white shadow-card sm:p-8 lg:grid lg:grid-cols-[1fr_auto] lg:items-center lg:gap-8">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[.2em] text-white/70">Need help now?</p>
            <h2 className="mt-3 font-display text-3xl font-semibold sm:text-5xl">Troubleshoot the current pizza problem.</h2>
          </div>
          <Link
            href="/guide/pizza-troubleshooting"
            className={buttonClass({ className: "mt-6 w-full bg-white text-tomato hover:bg-flour sm:w-auto lg:mt-0" })}
          >
            Fix pizza problems
          </Link>
        </section>

        <SiteFooter />
      </div>
    </main>
  );
}
