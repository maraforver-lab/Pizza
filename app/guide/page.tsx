import Image from "next/image";
import Link from "next/link";
import SiteFooter from "@/components/SiteFooter";
import { buttonClass, cardClass } from "@/components/design-system";
import { DoughToolsIcon, type DoughToolsIconName } from "@/components/icons";

type GuideLink = {
  description: string;
  href: string;
  icon: DoughToolsIconName;
  step?: number;
  title: string;
};

const learningPathGuides: GuideLink[] = [
  {
    step: 1,
    title: "Dough",
    description: "Build the foundation: flour, water, fermentation and dough handling.",
    href: "/guides/dough",
    icon: "mixing-bowl",
  },
  {
    step: 2,
    title: "Sauce",
    description: "Choose the right sauce style and control moisture.",
    href: "/sauce",
    icon: "chef-hat",
  },
  {
    step: 3,
    title: "Toppings",
    description: "Balance flavour, quantity and moisture before baking.",
    href: "/toppings",
    icon: "pizza",
  },
  {
    step: 4,
    title: "Ovens",
    description: "Learn how your oven setup changes the bake.",
    href: "/ovens",
    icon: "oven",
  },
  {
    step: 5,
    title: "Practical Tips",
    description: "Solve common problems and improve your next pizza.",
    href: "/guide/practical-pizza-tips",
    icon: "warning",
  },
];

const supportingGuides: GuideLink[] = [
  {
    title: "Choose your pizza",
    description: "Choose a practical starting pizza style before you plan the bake.",
    href: "/styles",
    icon: "pizza",
  },
  {
    title: "Fix pizza problems",
    description: "Find causes and fixes when dough, baking or toppings go wrong.",
    href: "/guide/pizza-troubleshooting",
    icon: "warning",
  },
];

const topicShortcuts = [
  {
    id: "hydration",
    title: "Hydration",
    description: "Water changes dough feel, stickiness and stretch.",
  },
  {
    id: "fermentation",
    title: "Fermentation",
    description: "Time and temperature change flavour, gas and readiness.",
  },
  {
    id: "flour-strength",
    title: "Flour strength",
    description: "Flour structure affects water, handling and fermentation fit.",
  },
  {
    id: "gluten-development",
    title: "Gluten development",
    description: "Strength and rest decide whether dough stretches without tearing.",
  },
  {
    id: "oven-heat",
    title: "Oven heat",
    description: "Heat changes browning, base texture and bake timing.",
  },
] as const;

function GuideCard({ link, priority = false }: { link: GuideLink; priority?: boolean }) {
  return (
    <Link
      href={link.href}
      className={cardClass({
        className: `group flex h-full flex-col p-5 shadow-soft transition hover:-translate-y-1 hover:shadow-card sm:p-6 ${
          priority ? "border-tomato/20 bg-white" : "bg-card"
        }`,
        variant: priority ? "information" : "default",
      })}
    >
      <span className="flex items-center justify-between gap-3">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-tomato/10 text-tomato ring-1 ring-tomato/15" aria-hidden="true">
          <DoughToolsIcon name={link.icon} size={24} />
        </span>
        {link.step ? (
          <span className="rounded-full bg-ink/5 px-3 py-1 text-xs font-extrabold text-ink/45 tabular-nums">
            {String(link.step).padStart(2, "0")}
          </span>
        ) : null}
      </span>
      <h3 className="mt-5 font-display text-2xl font-semibold text-ink">{link.title}</h3>
      <p className="mt-3 flex-1 text-sm leading-6 text-ink/62">{link.description}</p>
      <span className="mt-5 text-sm font-extrabold text-tomato transition group-hover:text-ink">Explore guide</span>
    </Link>
  );
}

export default function Guide() {
  return (
    <main className="min-h-screen overflow-x-clip bg-warm-background text-ink">
      <section className="relative overflow-hidden bg-forest-dark text-white">
        <div className="absolute inset-0 opacity-60">
          <Image
            src="/images/homepage/doughtools-hero-desktop.webp"
            alt="Finished pizza beside prepared dough on a warm kitchen work surface"
            fill
            priority
            sizes="100vw"
            className="object-cover object-[58%_center]"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/76 to-ink/25" aria-hidden="true" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
          <p className="text-xs font-extrabold uppercase tracking-[.24em] text-oven-gold">Pizza guides</p>
          <h1 className="mt-4 max-w-4xl font-display text-4xl font-semibold leading-[0.95] tracking-tight sm:mt-5 sm:text-6xl lg:text-7xl">
            Learn pizza one choice at a time.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-8 text-white/78 sm:mt-6 sm:text-lg">
            Use the guides to understand dough, sauce, toppings and ovens before you turn those choices into a pizza plan.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <section className="rounded-[2rem] border border-ink/10 bg-white/78 p-5 shadow-card sm:p-7 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(18rem,.42fr)] lg:items-center lg:gap-8" aria-labelledby="guide-quick-explanation-title">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[.2em] text-tomato">Quick explanation</p>
            <h2 id="guide-quick-explanation-title" className="mt-3 font-display text-4xl font-semibold sm:text-5xl">
              Learn pizza step by step
            </h2>
            <p className="mt-4 max-w-3xl text-base leading-8 text-ink/64">
              Understand the choices behind great pizza, from dough and sauce to toppings and baking.
            </p>
          </div>
          <div className="mt-5 rounded-[1.5rem] border border-leaf/20 bg-leaf/[.08] p-4 lg:mt-0">
            <p className="text-sm font-extrabold text-ink">New to pizza? Start with Dough.</p>
            <p className="mt-2 text-sm leading-6 text-ink/62">
              Dough teaches the base process first, then the other guides help you control flavour, moisture and heat.
            </p>
          </div>
        </section>

        <section className="mt-12" aria-labelledby="learning-path-title">
          <div className="max-w-3xl">
            <p className="text-xs font-extrabold uppercase tracking-[.2em] text-tomato">Recommended learning path</p>
            <h2 id="learning-path-title" className="mt-3 font-display text-4xl font-semibold sm:text-5xl">
              A simple path to better pizza
            </h2>
            <p className="mt-3 text-sm leading-6 text-ink/62">
              Follow the path in order when you are learning from scratch, or jump to the guide that matches the decision in front of you.
            </p>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {learningPathGuides.map((link) => (
              <GuideCard key={link.href} link={link} priority={link.step === 1} />
            ))}
          </div>
        </section>

        <section className="mt-12" aria-labelledby="supporting-guide-title">
          <div className="max-w-3xl">
            <p className="text-xs font-extrabold uppercase tracking-[.2em] text-tomato">More ways to learn</p>
            <h2 id="supporting-guide-title" className="mt-3 font-display text-3xl font-semibold sm:text-4xl">
              Use these when you have a specific question.
            </h2>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {supportingGuides.map((link) => (
              <GuideCard key={link.href} link={link} />
            ))}
          </div>
        </section>

        <section className="mt-12" aria-labelledby="topic-shortcuts-title">
          <div className={cardClass({ className: "p-5 shadow-soft sm:p-6", variant: "default" })}>
            <p className="text-xs font-extrabold uppercase tracking-[.2em] text-tomato">Topic shortcuts</p>
            <h2 id="topic-shortcuts-title" className="mt-3 font-display text-3xl font-semibold">
              Quick orientation
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-ink/62">
              These anchors keep older guide links useful. For full lessons, use the guides above.
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {topicShortcuts.map((topic) => (
                <div key={topic.id} id={topic.id} className="scroll-mt-24 rounded-[1.25rem] border border-ink/10 bg-white p-4">
                  <h3 className="text-sm font-extrabold">{topic.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-ink/58">{topic.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-12 rounded-[2rem] bg-tomato p-6 text-white shadow-card sm:p-10 lg:grid lg:grid-cols-[1fr_auto] lg:items-center lg:gap-8">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[.2em] text-white/70">Ready to use what you learned?</p>
            <h2 className="mt-3 font-display text-4xl font-semibold sm:text-5xl">Plan a pizza with less guesswork.</h2>
          </div>
          <Link
            href="/session/start"
            className={buttonClass({ className: "mt-6 w-full bg-white text-tomato hover:bg-flour sm:w-auto lg:mt-0" })}
          >
            Plan a pizza
          </Link>
        </section>
        <SiteFooter />
      </div>
    </main>
  );
}
