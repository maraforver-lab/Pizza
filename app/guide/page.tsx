import Image from "next/image";
import Link from "next/link";
import SiteFooter from "@/components/SiteFooter";
import { buttonClass, cardClass } from "@/components/design-system";
import { DoughToolsIcon, type DoughToolsIconName } from "@/components/icons";

type GuideLink = {
  description: string;
  href: string;
  icon: DoughToolsIconName;
  title: string;
};

const primaryGuides: GuideLink[] = [
  {
    title: "How to make pizza dough",
    description: "Learn how to make the dough and understand fermentation.",
    href: "/guides/dough",
    icon: "mixing-bowl",
  },
  {
    title: "How to make pizza sauce",
    description: "Learn how to make the sauce and see the right sauce amount for one pizza or a full batch.",
    href: "/sauce",
    icon: "chef-hat",
  },
];

const secondaryGuides: GuideLink[] = [
  {
    title: "Baking guides",
    description: "Compare oven types and understand how heat changes the bake.",
    href: "/ovens",
    icon: "oven",
  },
  {
    title: "Choose your pizza",
    description: "Choose a practical starting pizza style before you plan the bake.",
    href: "/styles",
    icon: "pizza",
  },
  {
    title: "Practical pizza tips",
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
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-tomato/10 text-tomato ring-1 ring-tomato/15" aria-hidden="true">
        <DoughToolsIcon name={link.icon} size={24} />
      </span>
      <h3 className="mt-5 font-display text-2xl font-semibold text-ink">{link.title}</h3>
      <p className="mt-3 flex-1 text-sm leading-6 text-ink/62">{link.description}</p>
      <span className="mt-5 text-sm font-extrabold text-tomato transition group-hover:text-ink">Open {link.title}</span>
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
            Find the right pizza guide.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-8 text-white/78 sm:mt-6 sm:text-lg">
            Start with dough or sauce, then use the supporting guides for ovens, styles and troubleshooting.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <section aria-labelledby="primary-guide-title">
          <div className="max-w-3xl">
            <p className="text-xs font-extrabold uppercase tracking-[.2em] text-tomato">Start here</p>
            <h2 id="primary-guide-title" className="mt-3 font-display text-4xl font-semibold sm:text-5xl">
              Dough guides and sauce guides
            </h2>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {primaryGuides.map((link) => (
              <GuideCard key={link.href} link={link} priority />
            ))}
          </div>
        </section>

        <section className="mt-12" aria-labelledby="supporting-guide-title">
          <div className="max-w-3xl">
            <p className="text-xs font-extrabold uppercase tracking-[.2em] text-tomato">Practical pizza tips</p>
            <h2 id="supporting-guide-title" className="mt-3 font-display text-3xl font-semibold sm:text-4xl">
              Choose the guide you need next.
            </h2>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {secondaryGuides.map((link) => (
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
              These anchors keep older guide links useful. For full method and amounts, use the dedicated dough and sauce guides above.
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
