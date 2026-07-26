import type { Metadata } from "next";
import Link from "next/link";
import SiteFooter from "@/components/SiteFooter";
import { cardClass } from "@/components/design-system";
import { DoughToolsIcon, type DoughToolsIconName } from "@/components/icons";
import { LearningBreadcrumbs } from "@/components/learning/RelatedLearning";
import { metadataForRoute } from "@/lib/seo-config";

export const metadata: Metadata = metadataForRoute("/guide/practical-pizza-tips");

type PracticalPizzaTipTopic = {
  title: string;
  description: string;
  icon: DoughToolsIconName;
  href: string;
};

const practicalTopics: readonly PracticalPizzaTipTopic[] = [
  {
    title: "Leftover dough, freezing and thawing",
    description: "Store, freeze, thaw and safely use dough when pizza night changes.",
    icon: "refrigerator",
    href: "/guide/practical-pizza-tips/leftover-dough",
  },
  {
    title: "Choosing fermentation length",
    description: "How to choose a practical dough timeline for the time you have.",
    icon: "timer",
    href: "/guide/practical-pizza-tips/fermentation-length",
  },
  {
    title: "Dough container and lid use",
    description: "How container size, lid fit and surface drying affect dough handling.",
    icon: "yeast",
    href: "/guide/practical-pizza-tips/containers-and-lids",
  },
  {
    title: "Common dough, sauce and baking problems",
    description: "How to decide whether a problem came from formula, timing, toppings or heat.",
    icon: "warning",
    href: "/guide/practical-pizza-tips/common-problems",
  },
];

export default function PracticalPizzaTipsPage() {
  return (
    <main className="min-h-screen overflow-x-clip bg-warm-background text-ink">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
        <LearningBreadcrumbs current="Practical pizza tips" />

        <section className="mt-5 rounded-[2rem] border border-white/80 bg-white/80 p-6 shadow-card sm:p-8">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[.22em] text-tomato">Pizza guides</p>
            <h1 className="mt-3 max-w-4xl font-display text-4xl font-semibold leading-[.96] sm:text-6xl">
              Practical pizza tips
            </h1>
            <p className="mt-4 max-w-2xl text-base font-bold leading-8 text-ink/64">
              Short practical guides for the moments around a pizza plan: leftover dough, freezing, fermentation timing, containers and common problems.
            </p>
          </div>
        </section>

        <section className="mt-8" aria-labelledby="practical-tips-topic-title">
          <div className="max-w-3xl">
            <p className="text-xs font-extrabold uppercase tracking-[.2em] text-tomato">Practical topics</p>
            <h2 id="practical-tips-topic-title" className="mt-3 font-display text-3xl font-semibold sm:text-4xl">
              Small decisions that make the next pizza easier.
            </h2>
            <p className="mt-3 text-sm leading-6 text-ink/62">
              Open a focused tip when a small dough, sauce or baking decision needs a quick answer.
            </p>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {practicalTopics.map((topic) => (
              <Link
                key={topic.title}
                href={topic.href}
                className={cardClass({ className: "block p-5 transition hover:-translate-y-0.5 hover:border-tomato/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2", variant: "default" })}
              >
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-tomato/10 text-tomato ring-1 ring-tomato/15" aria-hidden="true">
                  <DoughToolsIcon name={topic.icon} size={20} />
                </span>
                <h3 className="mt-4 font-display text-2xl font-semibold">{topic.title}</h3>
                <p className="mt-2 text-sm leading-6 text-ink/62">{topic.description}</p>
                <p className="mt-4 text-xs font-extrabold uppercase tracking-[.16em] text-ink/42">
                  Explore guide
                </p>
              </Link>
            ))}
          </div>
        </section>

        <SiteFooter />
      </div>
    </main>
  );
}
