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
  plannedPatch: "452B" | "452C" | "452D";
  icon: DoughToolsIconName;
  href?: string;
};

const plannedTopics: readonly PracticalPizzaTipTopic[] = [
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
    href: "/guide/practical-pizza-tips/containers-and-lids",
  },
  {
    title: "Common dough, sauce and baking problems",
    description: "How to decide whether a problem came from formula, timing, toppings or heat.",
    plannedPatch: "452D",
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

        <section className="mt-8" aria-labelledby="planned-practical-tips-title">
          <div className="max-w-3xl">
            <p className="text-xs font-extrabold uppercase tracking-[.2em] text-tomato">Upcoming topics</p>
            <h2 id="planned-practical-tips-title" className="mt-3 font-display text-3xl font-semibold sm:text-4xl">
              Small decisions that make the next pizza easier.
            </h2>
            <p className="mt-3 text-sm leading-6 text-ink/62">
              Open a focused tip when a small dough, sauce or baking decision needs a quick answer.
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

        <SiteFooter />
      </div>
    </main>
  );
}
