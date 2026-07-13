import type { Metadata } from "next";
import Link from "next/link";
import SiteFooter from "@/components/SiteFooter";
import { DoughToolsIcon, type DoughToolsIconName } from "@/components/icons";
import PublicPageEnding, { type PublicPageEndingLink } from "@/components/learning/PublicPageEnding";
import { LearningBreadcrumbs } from "@/components/learning/RelatedLearning";
import SauceCalculator from "@/components/sauce/SauceCalculator";
import SauceMistakeCard from "@/components/sauce/SauceMistakeCard";

export const metadata: Metadata = {
  title: "Pizza Sauce Guide and Calculator | DoughTools",
  description:
    "Calculate how much pizza sauce you need, choose raw, cooked or reduced sauce, and adjust tomato moisture for your pizza style and oven.",
};

type ChoiceCard = {
  title: string;
  use: string;
  tradeoff: string;
  icon: DoughToolsIconName;
};

type MethodCard = {
  title: string;
  use: string;
  benefit: string;
  risk: string;
  icon: DoughToolsIconName;
};

type OvenAdjustment = {
  title: string;
  guidance: string;
  watch: string;
  icon: DoughToolsIconName;
};

type Mistake = {
  title: string;
  happens: string;
  cause: string;
  now: string;
  next: string;
};

const tomatoChoices: ChoiceCard[] = [
  {
    title: "Whole peeled tomatoes",
    icon: "water",
    use: "Best default when you want control over texture and fresh tomato character.",
    tradeoff: "You need to crush or mill them yourself and decide how much packing juice to keep.",
  },
  {
    title: "Passata",
    icon: "information",
    use: "Useful for smoother cooked sauces, pan pizzas or longer-baked styles.",
    tradeoff: "It can be too smooth or wet for a classic fast-baked Neapolitan-style pizza.",
  },
  {
    title: "Fresh tomatoes",
    icon: "success",
    use: "Useful only when the tomatoes are truly ripe, flavorful and in season.",
    tradeoff: "They often need water management; ordinary pale supermarket tomatoes are not automatically better than good canned tomatoes.",
  },
];

const methodChoices: MethodCard[] = [
  {
    title: "Raw sauce",
    icon: "success",
    use: "Use for fast, high-heat pizzas where the oven cooks the tomato on the pizza.",
    benefit: "Fresh tomato flavor and a lighter, less cooked profile.",
    risk: "Too much free liquid can soften the center.",
  },
  {
    title: "Cooked sauce",
    icon: "oven",
    use: "Use for lower-heat or longer-baked pizzas when you want more control.",
    benefit: "Moisture becomes easier to manage before the pizza reaches the oven.",
    risk: "Overcooking can make the sauce taste heavy or paste-like.",
  },
  {
    title: "Reduced sauce",
    icon: "timer",
    use: "Use when the same tomato product is too loose for your bake.",
    benefit: "Concentrates tomato and reduces the chance of a wet center.",
    risk: "Too much reduction can dominate the dough and cheese.",
  },
];

const ovenAdjustments: OvenAdjustment[] = [
  {
    title: "Pizza oven",
    icon: "oven",
    guidance: "Use controlled amounts and keep the tomato fresh. The short bake gives less time for moisture to evaporate, but strong heat sets the pizza quickly.",
    watch: "Avoid heavy sauce and overloaded toppings.",
  },
  {
    title: "Home oven",
    icon: "thermometer",
    guidance: "Use slightly tighter moisture control: drain excess juice, reduce gently, or use less sauce when the bake is longer.",
    watch: "Watch for a soft center, wet cheese and a pale base.",
  },
  {
    title: "Pan or longer bake",
    icon: "pizza",
    guidance: "A thicker or lightly cooked sauce can make sense because the bake is slower and the dough style can carry more topping.",
    watch: "Do not turn sauce into paste; it should still spread easily.",
  },
];

const mistakes: Mistake[] = [
  {
    title: "Pizza becomes watery",
    happens: "The center stays soft, toppings slide or the base feels wet after baking.",
    cause: "Sauce, cheese and toppings release more moisture than the oven and dough can handle.",
    now: "Use less sauce on the next pizza and remove obvious pools before adding cheese.",
    next: "Drain loose tomato juice, manage wet mozzarella and preheat the baking surface properly.",
  },
  {
    title: "Sauce tastes flat",
    happens: "The tomato tastes dull even though the dough and bake are fine.",
    cause: "The tomato product lacks ripe flavor, or the salt level is not balanced for that brand.",
    now: "Taste the sauce before using it and adjust salt carefully.",
    next: "Compare tomato products by flavor, not label alone; sugar and garlic cannot rescue poor tomatoes.",
  },
  {
    title: "Sauce burns",
    happens: "Tomato tastes bitter or scorched before the pizza is otherwise ready.",
    cause: "Sauce is too exposed, too thick, too sugary or used in a heat environment that is too aggressive for the topping load.",
    now: "Use a thinner layer and protect exposed tomato with cheese or topping balance where appropriate.",
    next: "Match the sauce method to the oven: fresh and light for high heat, more controlled for longer bakes.",
  },
  {
    title: "Center remains wet",
    happens: "The rim looks done, but the middle stays pale, soft or soupy.",
    cause: "Too much total moisture sits in the center: sauce amount, cheese moisture, toppings and insufficient bottom heat all combine.",
    now: "Reduce sauce amount and blot or drain wet toppings before the next pizza.",
    next: "Treat sauce as part of the whole moisture system, not as a separate problem.",
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

const advancedDetails = [
  {
    title: "Tomato solids and free water",
    body: "Two cans with the same weight can behave differently because one contains more flesh and the other carries more loose juice. The calculator gives a quantity target; the texture still needs judgment.",
  },
  {
    title: "Salt, acidity and tasting",
    body: "Salt changes how sweet, sharp and ripe the tomato tastes. Start from the calculator, then taste. Cheese, cured toppings and grated hard cheese can make the final pizza saltier than the sauce alone.",
  },
  {
    title: "Processing method",
    body: "Hand crushing keeps texture. A food mill can be clean and controlled. A brief pulse can work. The problem is over-processing until the tomato becomes foamy, watery or completely uniform.",
  },
  {
    title: "Storage and safety",
    body: "Keep sauce cold in a clean covered container, use clean utensils, avoid repeated warming and cooling, label the preparation date, and discard sauce with mold, off odors, fermentation or unsafe handling history.",
  },
];

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
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <div className="max-w-3xl">
            <LearningBreadcrumbs current="Pizza Sauce" />
            <p className="mt-7 text-xs font-extrabold uppercase tracking-[.24em] text-tomato">Pizza Sauce Guide</p>
            <h1 className="mt-4 font-display text-5xl font-semibold leading-[0.95] tracking-tight sm:text-6xl lg:text-7xl">
              Calculate the right amount. Choose the right sauce.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-muted sm:text-lg">
              Work out how much tomato sauce you need, then choose a raw, cooked or reduced method that fits your pizza
              style and oven.
            </p>
            <a
              className="mt-8 inline-flex min-h-12 items-center justify-center rounded-full bg-tomato px-6 text-sm font-extrabold text-white shadow-card transition hover:-translate-y-0.5 hover:bg-forest focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-tomato"
              href="#sauce-calculator"
            >
              Calculate my sauce
            </a>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <SauceCalculator />

        <section className="mt-10 rounded-[2rem] border border-leaf/20 bg-leaf/[.08] p-5 shadow-soft sm:p-7 lg:grid lg:grid-cols-[0.8fr_1.2fr] lg:gap-8">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[.2em] text-leaf">Practical recommendation</p>
            <h2 className="mt-3 font-display text-3xl font-semibold sm:text-4xl">Start simple, then adjust by oven.</h2>
          </div>
          <div className="mt-5 grid gap-4 text-sm leading-7 text-muted sm:grid-cols-2 lg:mt-0">
            <p>
              For a fast, high-heat pizza, start with whole peeled tomatoes, salt and a raw sauce texture that is
              spoonable but not watery.
            </p>
            <p>
              For a home oven or longer bake, control moisture first: drain loose juice, reduce gently or use less sauce
              before adding more seasoning.
            </p>
          </div>
        </section>

        <section className="mt-16" aria-labelledby="tomatoes-title">
          <SectionIntro
            id="tomatoes-title"
            eyebrow="Choose your tomatoes"
            title="Pick the tomato by the job it needs to do."
            body="The label matters less than flavor, texture and water content. Choose the product that helps this pizza bake well."
          />
          <div className="mt-7 grid gap-4 lg:grid-cols-3">
            {tomatoChoices.map((choice) => (
              <article key={choice.title} className="rounded-[1.5rem] border border-ink/10 bg-card p-5 shadow-soft">
                <DoughToolsIcon name={choice.icon} className="text-tomato" size={24} />
                <h3 className="mt-4 text-lg font-extrabold">{choice.title}</h3>
                <p className="mt-3 text-sm leading-6 text-muted">{choice.use}</p>
                <p className="mt-3 rounded-2xl bg-flour p-3 text-sm leading-6 text-muted">
                  <strong className="text-ink">Trade-off:</strong> {choice.tradeoff}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-16" aria-labelledby="method-title">
          <SectionIntro
            id="method-title"
            eyebrow="Choose your method"
            title="Raw, cooked and reduced sauce solve different problems."
            body="There is no universal best sauce. The method should match the bake, the tomato and the topping load."
          />
          <div className="mt-7 grid gap-4 lg:grid-cols-3">
            {methodChoices.map((method) => (
              <article key={method.title} className="rounded-[1.5rem] border border-ink/10 bg-card p-5 shadow-soft">
                <DoughToolsIcon name={method.icon} className="text-leaf" size={24} />
                <h3 className="mt-4 text-lg font-extrabold">{method.title}</h3>
                <dl className="mt-4 space-y-3 text-sm leading-6 text-muted">
                  <div><dt className="font-extrabold text-ink">Use when</dt><dd>{method.use}</dd></div>
                  <div><dt className="font-extrabold text-ink">Benefit</dt><dd>{method.benefit}</dd></div>
                  <div><dt className="font-extrabold text-ink">Risk</dt><dd>{method.risk}</dd></div>
                </dl>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-16" aria-labelledby="oven-title">
          <SectionIntro
            id="oven-title"
            eyebrow="Adjust for your oven"
            title="The oven decides how careful you need to be with moisture."
            body="Sauce does not bake alone. Dough thickness, cheese moisture, toppings and oven heat all affect the result."
          />
          <div className="mt-7 grid gap-4 lg:grid-cols-3">
            {ovenAdjustments.map((adjustment) => (
              <article key={adjustment.title} className="rounded-[1.5rem] border border-ink/10 bg-card p-5 shadow-soft">
                <DoughToolsIcon name={adjustment.icon} className="text-tomato" size={24} />
                <h3 className="mt-4 text-lg font-extrabold">{adjustment.title}</h3>
                <p className="mt-3 text-sm leading-6 text-muted">{adjustment.guidance}</p>
                <p className="mt-3 rounded-2xl bg-warm-background p-3 text-sm leading-6 text-muted">
                  <strong className="text-ink">Watch:</strong> {adjustment.watch}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-16" aria-labelledby="mistakes-title">
          <SectionIntro
            id="mistakes-title"
            eyebrow="Compact troubleshooting"
            title="Fix the sauce by what happens on the pizza."
            body="Start with the visible problem, make one correction and keep the next bake easier to read."
          />
          <div className="mt-7 grid items-start gap-5 lg:grid-cols-2">
            {mistakes.map((mistake) => (
              <SauceMistakeCard
                key={mistake.title}
                title={mistake.title}
                symptom={mistake.happens}
                fixNow={mistake.now}
                cause={mistake.cause}
                nextTime={mistake.next}
              />
            ))}
          </div>
          <Link
            href="/guide/pizza-troubleshooting"
            className="mt-5 inline-flex min-h-12 items-center justify-center rounded-full bg-ink px-5 text-sm font-extrabold text-white shadow-soft transition hover:-translate-y-0.5 hover:bg-forest focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
          >
            Open deeper troubleshooting
          </Link>
        </section>

        <section className="mt-16 rounded-[2rem] border border-ink/10 bg-card p-5 shadow-soft sm:p-7" aria-labelledby="advanced-title">
          <SectionIntro
            id="advanced-title"
            eyebrow="Advanced detail"
            title="More detail, only when it changes your decision."
            body="These notes are useful when you want to tune sauce more precisely. The calculator and recommendation above are enough for most pizza nights."
          />
          <div className="mt-7 grid gap-3">
            {advancedDetails.map((detail) => (
              <details key={detail.title} className="group rounded-2xl border border-ink/10 bg-flour p-4">
                <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-4 text-sm font-extrabold text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-tomato">
                  {detail.title}
                  <DoughToolsIcon name="chevron-down" className="text-tomato transition group-open:rotate-180" size={20} />
                </summary>
                <p className="mt-3 text-sm leading-7 text-muted">{detail.body}</p>
              </details>
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
