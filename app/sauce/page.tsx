import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import SiteFooter from "@/components/SiteFooter";
import { DoughToolsIcon } from "@/components/icons";
import PublicPageEnding, { type PublicPageEndingLink } from "@/components/learning/PublicPageEnding";
import { LearningBreadcrumbs } from "@/components/learning/RelatedLearning";
import SauceCalculator from "@/components/sauce/SauceCalculator";
import SauceQuickAnswer from "@/components/sauce/SauceQuickAnswer";

export const metadata: Metadata = {
  title: "Pizza Sauce Recipe and Calculator | DoughTools",
  description:
    "Calculate sauce per pizza, total pizza sauce, and a simple pizza sauce recipe for raw, Marinara or home-oven cooked sauce.",
};

type TroubleshootingItem = {
  action: string;
  problem: string;
  fix: string;
  title: string;
};

const troubleshootingItems: TroubleshootingItem[] = [
  {
    title: "Wet center",
    problem: "Sauce, cheese, topping moisture and weak bottom heat are stacking together.",
    action: "Use less sauce, drain wet toppings and preheat the baking surface more thoroughly.",
    fix: "A lighter layer usually helps more than adding extra seasoning.",
  },
  {
    title: "Burnt base with pale top",
    problem: "The base is browning before the top has cooked through.",
    action: "Use a thinner sauce layer and check oven setup before adding wetter toppings.",
    fix: "If this repeats, use the oven guidance to balance top and bottom heat.",
  },
  {
    title: "Loose tomato texture",
    problem: "Some cans carry more free liquid than tomato solids.",
    action: "Drain obvious liquid or reduce gently until the sauce is spoonable.",
    fix: "Do not cook it into paste; it should still spread easily.",
  },
  {
    title: "Sauce tastes flat",
    problem: "The tomato product lacks ripe flavor or the salt level is not balanced for that brand.",
    action: "Taste before topping and adjust salt carefully.",
    fix: "Better tomatoes usually help more than sugar, paste or many competing seasonings.",
  },
];

const finalAction: PublicPageEndingLink = {
  title: "Plan a pizza",
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
            <LearningBreadcrumbs current="Sauce guides" />
            <p className="mt-6 text-xs font-extrabold uppercase tracking-[.24em] text-tomato">Sauce guides</p>
            <h1 className="mt-4 font-display text-4xl font-semibold leading-[0.95] tracking-tight sm:text-6xl lg:text-7xl">
              Choose the sauce, then measure it clearly.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-muted sm:text-lg">
              Pick a simple sauce path first, then calculate the amount for each pizza and the batch.
            </p>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <SauceQuickAnswer />

        <div className="mt-8">
          <SauceCalculator />
        </div>

        <section className="mt-12 rounded-[2rem] border border-ink/10 bg-card p-5 shadow-soft sm:p-7 lg:grid lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)] lg:gap-8" aria-labelledby="buy-tomatoes-title">
          <SectionIntro
            id="buy-tomatoes-title"
            eyebrow="Buy the tomatoes"
            title="Good tomatoes matter more than complicated technique."
            body="Start with a tomato product you would enjoy tasting plain. The sauce stays simple, so tomato quality carries most of the flavor."
          />
          <div className="mt-6 grid gap-4 lg:mt-0">
            <Image
              src="/sauce/neapolitan.webp"
              alt="Bowl of lightly crushed tomato sauce with basil and olive oil"
              width={960}
              height={600}
              className="aspect-[16/10] w-full rounded-[1.5rem] border border-ink/10 object-cover"
            />
            <div className="grid gap-3">
              {[
                ["What to buy", "Choose good canned whole peeled tomatoes first. San Marzano-style tomatoes are useful when the brand is ripe and balanced."],
                ["Whole peeled vs crushed", "Whole peeled tomatoes give you more control over texture. Crushed tomato or passata can work when the product is not watery or over-seasoned."],
                ["What matters most", "A simple sauce with better tomatoes usually beats a complex sauce built from weak tomatoes."],
              ].map(([title, body]) => (
                <article key={title} className="rounded-2xl border border-ink/10 bg-flour p-4">
                  <h3 className="text-sm font-extrabold text-ink">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted">{body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-12 rounded-[2rem] border border-ink/10 bg-card p-5 shadow-soft sm:p-7" aria-labelledby="make-apply-title">
          <SectionIntro
            id="make-apply-title"
            eyebrow="Make and apply the sauce"
            title="Keep the texture light and the layer restrained."
            body="Pizza sauce should be easy to spoon and spread. The calculator gives the amount; these habits keep the pizza balanced."
          />
          <div className="mt-6 grid gap-3 md:grid-cols-3">
            {[
              ["Crush or blend lightly", "Stop when the sauce is spoonable. Overworking can make the texture foamy or too smooth."],
              ["Do not overwork it", "A fresh raw sauce should still taste like tomato. Cook only when you want lower moisture or a denser result."],
              ["Use the measured amount", "Spread the calculator amount thinly from the center outward and leave the rim clear."],
            ].map(([title, body]) => (
              <article key={title} className="rounded-2xl border border-ink/10 bg-flour p-4">
                <DoughToolsIcon name="mixing-bowl" className="text-tomato" size={24} />
                <h3 className="mt-3 text-sm font-extrabold text-ink">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted">{body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-12 rounded-[2rem] border border-ink/10 bg-card p-5 shadow-soft sm:p-7" aria-labelledby="avoid-wet-burnt-title">
          <SectionIntro
            id="avoid-wet-burnt-title"
            eyebrow="Avoid a wet or burnt pizza"
            title="Fix sauce problems by changing moisture and heat, not by adding more ingredients."
            body="Most sauce problems come from too much water, too much sauce, or a bake setup that cooks the base and top at different speeds."
          />
          <div className="mt-6 grid gap-3 md:grid-cols-2">
            {troubleshootingItems.map((item) => (
              <article key={item.title} className="rounded-2xl border border-ink/10 bg-flour p-4">
                <h3 className="text-sm font-extrabold text-ink">{item.title}</h3>
                <dl className="mt-3 grid gap-3 text-sm leading-6 text-muted">
                  <div>
                    <dt className="font-extrabold text-ink">What is happening</dt>
                    <dd>{item.problem}</dd>
                  </div>
                  <div>
                    <dt className="font-extrabold text-ink">What to change</dt>
                    <dd>{item.action}</dd>
                  </div>
                  <div>
                    <dt className="font-extrabold text-ink">Keep in mind</dt>
                    <dd>{item.fix}</dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
          <Link
            href="/guide/pizza-troubleshooting"
            className="mt-5 inline-flex min-h-12 items-center justify-center rounded-full bg-ink px-5 text-sm font-extrabold text-white shadow-soft transition hover:-translate-y-0.5 hover:bg-forest focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
          >
            Open deeper troubleshooting
          </Link>
        </section>

        <section className="mt-12 rounded-[2rem] border border-ink/10 bg-card p-5 shadow-soft sm:p-7 lg:grid lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)] lg:gap-8" aria-labelledby="store-safely-title">
          <SectionIntro
            id="store-safely-title"
            eyebrow="Store safely"
            title="Keep extra sauce cold, covered and easy to identify."
            body="Sauce is simple food, but it still needs clean handling. Do not keep questionable sauce just because the tomato was expensive."
          />
          <div className="mt-6 grid gap-3 lg:mt-0">
            {[
              ["Chill it", "Move leftover sauce into a clean covered container and refrigerate it promptly."],
              ["Cool cooked sauce first", "If you cooked the sauce, cool it before storing so the container does not trap excess heat."],
              ["Discard unsafe sauce", "Throw it away if it has off odors, mold, visible spoilage or an unsafe handling history."],
            ].map(([title, body]) => (
              <article key={title} className="rounded-2xl border border-ink/10 bg-flour p-4">
                <h3 className="text-sm font-extrabold text-ink">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted">{body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-12 rounded-[2rem] border border-ink/10 bg-card p-5 shadow-soft sm:p-7" aria-labelledby="sauce-sources-title">
          <p className="text-xs font-extrabold uppercase tracking-[.2em] text-tomato">Sources and methodology</p>
          <h2 id="sauce-sources-title" className="mt-3 font-display text-4xl font-semibold sm:text-5xl">
            Traditional guidance, practical home-oven adaptation.
          </h2>
          <p className="mt-4 text-sm leading-7 text-muted sm:text-base">
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
          links={[]}
          relatedTitle=""
          action={finalAction}
          actionEyebrow="Ready to use the sauce in a real plan?"
          actionTitle="Plan a pizza with the sauce in mind."
        />
        <SiteFooter />
      </div>
    </main>
  );
}
