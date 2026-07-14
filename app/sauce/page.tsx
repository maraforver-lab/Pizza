import type { Metadata } from "next";
import Link from "next/link";
import SiteFooter from "@/components/SiteFooter";
import { DoughToolsIcon, type DoughToolsIconName } from "@/components/icons";
import PublicPageEnding, { type PublicPageEndingLink } from "@/components/learning/PublicPageEnding";
import { LearningBreadcrumbs } from "@/components/learning/RelatedLearning";
import SauceCalculator from "@/components/sauce/SauceCalculator";

export const metadata: Metadata = {
  title: "Pizza Sauce Recipe and Calculator | DoughTools",
  description:
    "Calculate sauce per pizza, total pizza sauce, and a simple pizza sauce recipe for raw, Marinara or home-oven cooked sauce.",
};

type GuidanceCard = {
  body: string;
  icon: DoughToolsIconName;
  title: string;
};

type TroubleshootingItem = {
  cause: string;
  fix: string;
  title: string;
};

const adjustmentGuidance: GuidanceCard[] = [
  {
    title: "Bigger or thicker pizza",
    icon: "pizza",
    body: "Raise the per-pizza amount when the pizza is larger, pan-style or deliberately sauce-forward.",
  },
  {
    title: "Fast high-heat bake",
    icon: "oven",
    body: "Use a restrained amount and keep the tomato fresh. Too much loose sauce can soften the center.",
  },
  {
    title: "Home oven or longer bake",
    icon: "thermometer",
    body: "Control moisture with draining, gentle reduction or a lower per-pizza amount before adding more seasoning.",
  },
];

const troubleshootingItems: TroubleshootingItem[] = [
  {
    title: "Sauce too watery",
    cause: "The tomato product carries loose juice, or the pizza has wet cheese and toppings too.",
    fix: "Drain obvious liquid, reduce gently or use a lighter per-pizza amount.",
  },
  {
    title: "Sauce too thick",
    cause: "Over-reduction can turn a pizza sauce into paste and make it dominate the bake.",
    fix: "Loosen with a little tomato juice and spread a thinner layer.",
  },
  {
    title: "Center stays wet",
    cause: "Sauce, cheese, topping moisture and weak bottom heat are stacking together.",
    fix: "Use less sauce, drain wet toppings and preheat the baking surface more thoroughly.",
  },
  {
    title: "Sauce tastes flat",
    cause: "The tomato product lacks ripe flavor or the salt level is not balanced for that brand.",
    fix: "Taste before topping and adjust salt carefully instead of adding many competing seasonings.",
  },
];

const relatedLinks: PublicPageEndingLink[] = [
  {
    title: "Oven Guide",
    href: "/ovens",
    description: "Match sauce moisture to your real baking environment.",
  },
  {
    title: "Topping Balance Lab",
    href: "/toppings",
    description: "Balance sauce, cheese and topping moisture before baking.",
  },
  {
    title: "Pizza Troubleshooting Guide",
    href: "/guide/pizza-troubleshooting",
    description: "Diagnose wet centers, pale bases and burnt toppings.",
  },
];

const finalAction: PublicPageEndingLink = {
  title: "Plan my next pizza",
  href: "/session/start",
  description: "Use the sauce in a real pizza plan.",
};

function SectionIntro({ body, eyebrow, id, title }: { body?: string; eyebrow: string; id: string; title: string }) {
  return (
    <div className="max-w-3xl">
      <p className="text-xs font-extrabold uppercase tracking-[.2em] text-tomato">{eyebrow}</p>
      <h2 id={id} className="mt-3 font-display text-4xl font-semibold sm:text-5xl">{title}</h2>
      {body ? <p className="mt-4 text-sm leading-7 text-muted sm:text-base">{body}</p> : null}
    </div>
  );
}

export default function SaucePage() {
  return (
    <main className="min-h-screen overflow-x-clip bg-warm-background text-ink">
      <section className="border-b border-ink/10 bg-card">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          <div className="max-w-3xl">
            <LearningBreadcrumbs current="Pizza Sauce" />
            <p className="mt-6 text-xs font-extrabold uppercase tracking-[.24em] text-tomato">Pizza Sauce Guide</p>
            <h1 className="mt-4 font-display text-4xl font-semibold leading-[0.95] tracking-tight sm:text-6xl lg:text-7xl">
              Make the sauce, then measure it clearly.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-muted sm:text-lg">
              See the recommended sauce per pizza, total sauce for the batch, and the short recipe steps before the deeper guidance.
            </p>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <SauceCalculator />

        <section className="mt-12" aria-labelledby="adjust-sauce-title">
          <SectionIntro
            id="adjust-sauce-title"
            eyebrow="Adjust the sauce"
            title="Change the amount only when the pizza changes."
            body="The calculator gives a practical starting point. Adjust for pizza size, oven heat, cheese moisture and how sauce-forward the style should be."
          />
          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            {adjustmentGuidance.map((item) => (
              <article key={item.title} className="rounded-[1.5rem] border border-ink/10 bg-card p-5 shadow-soft">
                <DoughToolsIcon name={item.icon} className="text-tomato" size={24} />
                <h3 className="mt-4 text-lg font-extrabold">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-muted">{item.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-12 rounded-[2rem] border border-ink/10 bg-card p-5 shadow-soft sm:p-7" aria-labelledby="texture-title">
          <SectionIntro
            id="texture-title"
            eyebrow="Texture and troubleshooting"
            title="Fix the result by what happens on the pizza."
            body="Use these as quick corrections after the calculated amount. For a deeper diagnosis, open the troubleshooting guide."
          />
          <div className="mt-6 grid gap-3 md:grid-cols-2">
            {troubleshootingItems.map((item) => (
              <details key={item.title} className="group rounded-2xl border border-ink/10 bg-flour p-4">
                <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-4 text-sm font-extrabold text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-tomato">
                  {item.title}
                  <DoughToolsIcon name="chevron-down" className="shrink-0 text-tomato transition group-open:rotate-180" size={20} />
                </summary>
                <dl className="mt-3 grid gap-3 text-sm leading-6 text-muted">
                  <div>
                    <dt className="font-extrabold text-ink">Likely cause</dt>
                    <dd>{item.cause}</dd>
                  </div>
                  <div>
                    <dt className="font-extrabold text-ink">What to change</dt>
                    <dd>{item.fix}</dd>
                  </div>
                </dl>
              </details>
            ))}
          </div>
          <Link
            href="/guide/pizza-troubleshooting"
            className="mt-5 inline-flex min-h-12 items-center justify-center rounded-full bg-ink px-5 text-sm font-extrabold text-white shadow-soft transition hover:-translate-y-0.5 hover:bg-forest focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
          >
            Open deeper troubleshooting
          </Link>
        </section>

        <section className="mt-12 rounded-[2rem] border border-ink/10 bg-card p-5 shadow-soft sm:p-7" aria-labelledby="sauce-notes-title">
          <SectionIntro
            id="sauce-notes-title"
            eyebrow="Notes"
            title="Useful details without a second recipe."
            body="Tomatoes vary by brand, season and water content. Keep grams as the main unit, taste the sauce before topping, and treat cans, cloves and leaves as practical estimates."
          />
          <div className="mt-6 grid gap-3 md:grid-cols-3">
            {[
              ["Tomato solids", "Two cans with the same weight can behave differently if one has more loose juice."],
              ["Salt and acidity", "Start from the calculator, then taste. Cheese and cured toppings can make the final pizza saltier."],
              ["Storage", "Keep sauce cold in a clean covered container and discard sauce with off odors, mold or unsafe handling history."],
            ].map(([title, body]) => (
              <article key={title} className="rounded-2xl border border-ink/10 bg-flour p-4">
                <h3 className="text-sm font-extrabold text-ink">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted">{body}</p>
              </article>
            ))}
          </div>
          <p className="mt-6 text-sm leading-7 text-muted">
            Traditional Neapolitan guidance is based on AVPN regulations and preparation guidance. Practical home-oven
            adaptations are DoughTools recommendations, not claims that every sauce must be prepared one way.
            {" "}
            <Link href="/methodology#pizza-sauce" className="font-extrabold text-tomato underline-offset-4 hover:underline">
              View sources and methodology
            </Link>
            .
          </p>
        </section>

        <PublicPageEnding
          links={relatedLinks}
          relatedTitle="Keep sauce connected to heat and toppings."
          action={finalAction}
          actionEyebrow="Ready to use the sauce in a real plan?"
          actionTitle="Plan my next pizza with the sauce in mind."
        />
        <SiteFooter />
      </div>
    </main>
  );
}
