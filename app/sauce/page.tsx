import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import AppSignature from "@/components/AppSignature";
import { DoughToolsIcon, type DoughToolsIconName } from "@/components/icons";
import { LearningBreadcrumbs } from "@/components/learning/RelatedLearning";
import SauceCalculator from "@/components/sauce/SauceCalculator";

export const metadata: Metadata = {
  title: "Pizza Sauce Guide and Calculator | DoughTools",
  description:
    "Learn how to make Neapolitan, Marinara, and home-oven pizza sauce, choose the right tomatoes, avoid common mistakes, and calculate exact quantities for your pizzas.",
};

type MethodCard = {
  title: string;
  label: string;
  image: string;
  alt: string;
  summary: string;
  ingredients: string[];
  steps: string[];
  note: string;
};

type Mistake = {
  title: string;
  happens: string;
  cause: string;
  now: string;
  next: string;
};

const methods: MethodCard[] = [
  {
    title: "Classic Neapolitan tomato base",
    label: "AVPN-defined traditional practice",
    image: "/sauce/neapolitan.webp",
    alt: "Uncooked tomato base with visible tomato texture beside a finished Neapolitan-style pizza.",
    summary: "The tomato should taste fresh because the oven cooks it on the pizza.",
    ingredients: ["quality whole peeled tomatoes", "salt"],
    steps: [
      "Open and inspect the tomatoes.",
      "Drain only when clearly necessary; do not remove all useful juice by default.",
      "Crush by hand, pass through a food mill, or process very briefly.",
      "Preserve a natural, slightly chunky consistency.",
      "Add the calculated salt, taste, and keep cold until needed.",
      "Apply a controlled amount to the pizza, leaving the cornicione clear.",
    ],
    note: "Avoid blending until foamy or completely uniform. Careful milling or a very brief pulse can be useful; the problem is destroying texture, not the existence of a tool.",
  },
  {
    title: "Traditional Marinara topping",
    label: "Traditional pizza topping profile",
    image: "/sauce/marinara.webp",
    alt: "Pizza marinara with tomato, garlic, oregano and olive oil, without cheese.",
    summary: "Marinara is tomato, garlic, oregano and extra-virgin olive oil — no mozzarella required.",
    ingredients: ["tomato", "garlic", "oregano", "extra-virgin olive oil", "salt"],
    steps: [
      "Prepare the tomato base without cooking it.",
      "Spread tomato thinly from the center outward.",
      "Add thinly sliced or carefully prepared garlic as part of the topping profile.",
      "Season with oregano and extra-virgin olive oil.",
      "Choose mild, traditional, or stronger garlic according to taste and clove size.",
    ],
    note: "The name does not mean seafood. It is a classic cheese-free pizza profile, not a universal tomato sauce for every pizza.",
  },
  {
    title: "Home-oven cooked sauce",
    label: "DoughTools practical adaptation",
    image: "/sauce/home.webp",
    alt: "Thicker tomato sauce prepared for a longer home-oven pizza bake.",
    summary: "Lower oven heat and longer bake time can benefit from more controlled moisture.",
    ingredients: ["whole peeled tomatoes", "salt", "extra-virgin olive oil", "optional garlic", "optional oregano"],
    steps: [
      "Crush or mill the tomatoes.",
      "Cook gently, uncovered.",
      "Add optional garlic and oregano according to the selected profile.",
      "Reduce only enough to reach the intended consistency.",
      "Cool fully before using.",
      "Weigh the finished yield if you need exact coverage.",
    ],
    note: "This is not the classic uncooked Neapolitan method. Do not add sugar automatically; taste first and use only a very small amount when tomatoes are genuinely harsh.",
  },
];

const tomatoTypes = [
  ["Whole peeled plum tomatoes", "Best default for control over texture, manual crushing, and evaluating actual tomato quality."],
  ["San Marzano DOP", "A protected origin designation. It can be excellent, but “San Marzano style” is not the same as DOP certification, and non-DOP tomatoes can still be excellent."],
  ["Crushed tomatoes", "Useful when the ingredient list is clean and the texture is already right. Brand variation is large."],
  ["Passata", "Useful for smoother or cooked styles, but often too smooth or wet for classic Neapolitan preferences."],
  ["Fresh ripe tomatoes", "Can be beautiful in season, but ordinary pale supermarket tomatoes are not automatically better than quality canned tomatoes."],
] as const;

const textureStates = [
  {
    title: "Too watery",
    icon: "water",
    appearance: "Free liquid pools around the tomato.",
    result: "Wet center, diluted flavor, sliding toppings, and a soft home-oven base.",
    correction: "Use less sauce, leave excess packing juice behind, drain briefly, reduce cooked sauce, manage cheese moisture, and preheat the stone or steel properly.",
  },
  {
    title: "Balanced",
    icon: "success",
    appearance: "Spoonable texture with no large pools of free liquid.",
    result: "Fresh tomato flavor spreads cleanly without acting like paste.",
    correction: "Keep the texture natural and judge coverage together with cheese moisture, pizza size and oven heat.",
  },
  {
    title: "Too thick",
    icon: "warning",
    appearance: "Paste-like sauce that resists spreading.",
    result: "Heavy tomato layer, dry flavor, poor spreading, and sauce that dominates dough and cheese.",
    correction: "Add reserved tomato juice, reduce less, use less tomato paste, or lower the sauce amount per pizza.",
  },
] as const satisfies Array<{ title: string; icon: DoughToolsIconName; appearance: string; result: string; correction: string }>;

const ingredientRoles = [
  ["Tomato", "Core flavor, acidity, sweetness, moisture and texture."],
  ["Salt", "Balances tomato flavor. Calculate by tomato weight, then taste and remember that cheese and cured toppings add salt."],
  ["Extra-virgin olive oil", "Aroma, richness and cooking behavior. Traditionally applied as part of the pizza topping, not automatically blended into every tomato base."],
  ["Basil", "Fresh aromatic topping. It can go before baking or be protected beneath cheese when burning is a risk."],
  ["Garlic", "Central to Marinara, optional in many cooked sauces, and not required in a classic Margherita tomato base."],
  ["Oregano", "Traditional in Marinara and common in some longer-baked styles, but not required in classic Margherita tomato base."],
  ["Sugar", "Not a default requirement. It can slightly soften harsh acidity, but it cannot turn poor tomatoes into ripe tomatoes."],
  ["Tomato paste", "Useful in some cooked, pan, American or long-baked styles; generally unnecessary for classic uncooked Neapolitan tomato base."],
] as const;

const mistakes: Mistake[] = [
  {
    title: "Using too much sauce",
    happens: "The center stays wet and toppings slide.",
    cause: "Coverage is heavier than the dough, cheese moisture or oven heat can support.",
    now: "Remove obvious excess before adding cheese, or bake one pizza as a test and reduce the next one.",
    next: "Weigh the sauce for a few pizzas and adjust from the calculator’s balanced amount.",
  },
  {
    title: "Using tomatoes with poor flavor",
    happens: "The pizza tastes flat, harsh or metallic even when the dough is good.",
    cause: "The tomato product lacks ripe flavor or balance.",
    now: "Taste before seasoning. Add salt carefully, but do not hide bad tomatoes with sugar or garlic.",
    next: "Compare whole peeled tomatoes, crushed tomatoes and passata by taste, not label alone.",
  },
  {
    title: "Blending until completely foamy or watery",
    happens: "The sauce becomes pale, thin or strangely uniform.",
    cause: "Too much processing destroys natural texture and may break more seeds.",
    now: "Let foam settle and use a lighter amount.",
    next: "Crush by hand, use a food mill, or pulse very briefly.",
  },
  {
    title: "Automatically adding garlic to Margherita sauce",
    happens: "Garlic dominates a pizza that should taste like tomato, dairy, basil and oil.",
    cause: "Marinara habits are applied to Margherita tomato base.",
    now: "Use it intentionally as a nontraditional variation, not by default.",
    next: "Keep garlic for Marinara or styles where it belongs.",
  },
  {
    title: "Automatically adding sugar",
    happens: "The sauce becomes sweet without solving weak tomato flavor.",
    cause: "Sugar is used before tasting and understanding acidity.",
    now: "Stop adding more; balance with salt and better tomato choice.",
    next: "Use a tiny amount only when tomatoes are genuinely harsh.",
  },
  {
    title: "Cooking a classic fast-bake sauce without a reason",
    happens: "The tomato loses the fresh character expected from fast-baked Neapolitan pizza.",
    cause: "A home-oven adaptation is used for a high-heat method that does not need it.",
    now: "Use less cooked sauce or switch to the uncooked method next pizza.",
    next: "Choose the method from the oven and pizza style, not habit.",
  },
  {
    title: "Leaving a home-oven sauce excessively wet",
    happens: "The base stays pale, soft or soggy during a longer bake.",
    cause: "Lower oven heat gives moisture more time to soak into dough and toppings.",
    now: "Reduce sauce amount and manage cheese moisture.",
    next: "Cook gently to the target consistency or leave excess packing juice behind.",
  },
  {
    title: "Ignoring wet mozzarella or topping moisture",
    happens: "The sauce gets blamed, but the wet layer comes from everything on top.",
    cause: "Fresh cheese, vegetables or heavy topping load release moisture during baking.",
    now: "Drain or blot wet ingredients before the next pizza.",
    next: "Treat sauce, cheese and toppings as one moisture system.",
  },
  {
    title: "Measuring only by spoons",
    happens: "Two pizzas get very different amounts of sauce.",
    cause: "Consistency varies, so spoon volume is unreliable.",
    now: "Weigh the next pizza’s sauce once to calibrate your eye.",
    next: "Use grams while learning, then switch to feel when the result is consistent.",
  },
  {
    title: "Making sauce too far ahead without safe storage",
    happens: "Fresh tomato flavor fades, or the sauce becomes unsafe.",
    cause: "The batch was warmed, cooled, contaminated or held too long.",
    now: "Discard sauce with spoilage, fermentation, mold, off odors or unsafe handling history.",
    next: "Refrigerate promptly in clean covered containers and freeze excess when useful.",
  },
];

const relatedLinks = [
  ["Pizza Learning Center", "/guide", "Understand hydration, fermentation, oven heat and other concepts."],
  ["Pizza Dough Guide", "/guides/dough", "Follow the dough process from mixing to stretching readiness."],
  ["Pizza Troubleshooting Guide", "/guide/pizza-troubleshooting", "Fix wet centers, pale bases, scorched rims and other problems."],
  ["Pizza Styles", "/styles", "Match sauce choices to the style you want to bake."],
  ["Topping Balance Lab", "/toppings", "Compare sauce, cheese and topping load before the pizza reaches the oven."],
  ["Ovens", "/ovens", "Understand how your baking setup changes sauce and moisture decisions."],
] as const;

export default function SaucePage() {
  return (
    <main className="min-h-screen overflow-x-clip bg-warm-background text-ink">
      <section className="relative overflow-hidden bg-forest-dark text-white">
        <div className="absolute inset-0 opacity-72">
          <Image
            src="/sauce/neapolitan.webp"
            alt="Fresh tomato sauce and finished pizza on a warm pizza-making surface"
            fill
            priority
            sizes="100vw"
            className="object-cover object-[54%_center]"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/76 to-ink/20" aria-hidden="true" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
          <div className="max-w-3xl">
            <div className="[&_a]:text-oven-gold [&_span]:text-white/60">
              <LearningBreadcrumbs current="Pizza Sauce" />
            </div>
            <p className="text-xs font-extrabold uppercase tracking-[.24em] text-oven-gold">Pizza Sauce Guide</p>
            <h1 className="mt-5 font-display text-5xl font-semibold leading-[0.95] tracking-tight sm:text-6xl lg:text-7xl">
              Better pizza sauce starts with better decisions.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-white/78 sm:text-lg">
              Learn which tomatoes to choose, how to season them, when not to cook the sauce, and exactly how much you
              need for every pizza.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a className="inline-flex min-h-12 items-center justify-center rounded-full bg-tomato px-6 text-sm font-extrabold text-white shadow-card transition hover:-translate-y-0.5 hover:bg-forest focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white" href="#sauce-calculator">
                Calculate my sauce
              </a>
              <a className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/35 bg-white/10 px-6 text-sm font-extrabold text-white backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/18 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white" href="#three-methods">
                Learn the three methods
              </a>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <section className="rounded-[2rem] border border-ink/10 bg-card p-5 shadow-card sm:p-8" aria-labelledby="quick-answer-title">
          <p className="text-xs font-extrabold uppercase tracking-[.2em] text-tomato">Quick answer</p>
          <h2 id="quick-answer-title" className="mt-3 font-display text-4xl font-semibold">
            What goes into Neapolitan pizza sauce?
          </h2>
          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            <article className="rounded-[1.5rem] bg-flour p-5">
              <h3 className="text-lg font-extrabold">Classic Margherita tomato base</h3>
              <p className="mt-3 text-sm leading-6 text-muted">
                The base is fundamentally quality peeled tomatoes and salt. Fresh basil, extra-virgin olive oil,
                mozzarella or fior di latte, and optional grated hard cheese are pizza toppings rather than ingredients
                that must be blended into the tomato base.
              </p>
              <ul className="mt-4 space-y-2 text-sm leading-6 text-muted">
                <li>Garlic is not standard in the classic Margherita tomato base.</li>
                <li>Oregano is not standard in the classic Margherita tomato base.</li>
                <li>Sugar is not automatically required.</li>
                <li>The tomato base is generally not precooked for a fast-baked Neapolitan pizza.</li>
              </ul>
            </article>
            <article className="rounded-[1.5rem] bg-flour p-5">
              <h3 className="text-lg font-extrabold">Pizza Marinara</h3>
              <p className="mt-3 text-sm leading-6 text-muted">
                Traditional Marinara includes tomato, garlic, oregano and extra-virgin olive oil. Despite the name, it
                is not a seafood sauce. It is the classic cheese-free tomato pizza profile.
              </p>
            </article>
            <article className="rounded-[1.5rem] border border-tomato/20 bg-tomato/10 p-5">
              <h3 className="text-lg font-extrabold">Home-oven adaptation</h3>
              <p className="mt-3 text-sm leading-6 text-muted">
                A longer bake at lower heat may benefit from more controlled moisture, a somewhat thicker consistency,
                optional brief cooking or draining, and style-specific seasoning. This is an adaptation, not the AVPN
                Margherita method.
              </p>
            </article>
          </div>
        </section>

        <div className="mt-12">
          <SauceCalculator />
        </div>

        <section id="three-methods" className="mt-16 scroll-mt-24" aria-labelledby="methods-title">
          <div className="max-w-3xl">
            <p className="text-xs font-extrabold uppercase tracking-[.2em] text-tomato">Three sauce methods</p>
            <h2 id="methods-title" className="mt-3 font-display text-4xl font-semibold sm:text-5xl">
              Choose the method from the oven and the pizza, not habit.
            </h2>
          </div>
          <div className="mt-8 grid gap-5">
            {methods.map((method) => (
              <article key={method.title} className="overflow-hidden rounded-[2rem] border border-ink/10 bg-card shadow-card lg:grid lg:grid-cols-[0.72fr_1.28fr]">
                <div className="relative min-h-[18rem]">
                  <Image src={method.image} alt={method.alt} fill sizes="(max-width: 1024px) 100vw, 40vw" className="object-cover" />
                </div>
                <div className="p-5 sm:p-7 lg:p-9">
                  <p className="text-xs font-extrabold uppercase tracking-[.18em] text-leaf">{method.label}</p>
                  <h3 className="mt-2 font-display text-3xl font-semibold">{method.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-muted">{method.summary}</p>
                  <div className="mt-5 grid gap-5 lg:grid-cols-[0.55fr_1fr]">
                    <div>
                      <h4 className="text-sm font-extrabold">Ingredients</h4>
                      <ul className="mt-2 space-y-1 text-sm leading-6 text-muted">
                        {method.ingredients.map((ingredient) => <li key={ingredient}>• {ingredient}</li>)}
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold">Method</h4>
                      <ol className="mt-2 space-y-2 text-sm leading-6 text-muted">
                        {method.steps.map((step, index) => <li key={step}><strong className="text-ink">{index + 1}. </strong>{step}</li>)}
                      </ol>
                    </div>
                  </div>
                  <p className="mt-5 rounded-2xl bg-flour p-4 text-sm leading-6 text-muted">{method.note}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-16 grid gap-8 lg:grid-cols-[0.8fr_1.2fr]" aria-labelledby="tomato-title">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[.2em] text-tomato">Tomato selection</p>
            <h2 id="tomato-title" className="mt-3 font-display text-4xl font-semibold">
              Choose tomatoes for flavor, not for the label alone.
            </h2>
            <p className="mt-4 text-sm leading-7 text-muted">
              Look for ripe tomato flavor, balanced sweetness and acidity, low bitterness, enough flesh, and limited
              unnecessary additives. The label helps, but tasting teaches more.
            </p>
          </div>
          <div className="grid gap-3">
            {tomatoTypes.map(([title, body]) => (
              <article key={title} className="rounded-2xl border border-ink/10 bg-card p-5 shadow-soft">
                <h3 className="text-base font-extrabold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted">{body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-16 rounded-[2rem] bg-forest-dark p-5 text-white shadow-card sm:p-8 lg:p-10" aria-labelledby="texture-title">
          <p className="text-xs font-extrabold uppercase tracking-[.2em] text-oven-gold">Texture and moisture</p>
          <h2 id="texture-title" className="mt-3 font-display text-4xl font-semibold">
            Sauce texture is a baking decision.
          </h2>
          <div className="mt-7 grid gap-4 lg:grid-cols-3">
            {textureStates.map((state) => (
              <article key={state.title} className="rounded-[1.5rem] border border-white/12 bg-white/8 p-5">
                <DoughToolsIcon name={state.icon} className="text-oven-gold" size={32} />
                <h3 className="mt-4 text-lg font-extrabold">{state.title}</h3>
                <dl className="mt-4 space-y-3 text-sm leading-6 text-white/68">
                  <div><dt className="font-extrabold text-white">Appearance</dt><dd>{state.appearance}</dd></div>
                  <div><dt className="font-extrabold text-white">Likely result</dt><dd>{state.result}</dd></div>
                  <div><dt className="font-extrabold text-white">Correction</dt><dd>{state.correction}</dd></div>
                </dl>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-16" aria-labelledby="roles-title">
          <p className="text-xs font-extrabold uppercase tracking-[.2em] text-tomato">Ingredient roles</p>
          <h2 id="roles-title" className="mt-3 font-display text-4xl font-semibold">
            Every ingredient should have a reason.
          </h2>
          <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {ingredientRoles.map(([title, body]) => (
              <article key={title} className="rounded-[1.5rem] border border-ink/10 bg-card p-5 shadow-soft">
                <h3 className="text-base font-extrabold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted">{body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-16 overflow-hidden rounded-[2rem] border border-ink/10 bg-card shadow-card" aria-labelledby="application-title">
          <div className="grid lg:grid-cols-[1fr_1fr]">
            <div className="relative min-h-[20rem]">
              <Image src="/sauce/marinara.webp" alt="Pizza with a balanced tomato sauce layer spread inside the rim" fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" />
            </div>
            <div className="p-5 sm:p-8 lg:p-10">
              <p className="text-xs font-extrabold uppercase tracking-[.2em] text-tomato">Sauce application</p>
              <h2 id="application-title" className="mt-3 font-display text-4xl font-semibold">
                How much sauce should go on the pizza?
              </h2>
              <ul className="mt-5 space-y-3 text-sm leading-7 text-muted">
                <li>Weigh the sauce during initial practice.</li>
                <li>Start with the calculator’s balanced amount.</li>
                <li>Place sauce in the center and spread outward in a controlled spiral.</li>
                <li>Leave the cornicione clear.</li>
                <li>Avoid large pools and judge coverage together with cheese moisture and oven type.</li>
                <li>Remember that pizza diameter matters; use grams per pizza as a starting point and adjust by result.</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="mt-16" aria-labelledby="mistakes-title">
          <p className="text-xs font-extrabold uppercase tracking-[.2em] text-tomato">Common mistakes and corrections</p>
          <h2 id="mistakes-title" className="mt-3 font-display text-4xl font-semibold">
            Diagnose the sauce by what happens on the pizza.
          </h2>
          <div className="mt-7 grid gap-4 lg:grid-cols-2">
            {mistakes.map((mistake) => (
              <article key={mistake.title} className="rounded-[1.5rem] border border-ink/10 bg-card p-5 shadow-soft">
                <h3 className="text-lg font-extrabold">{mistake.title}</h3>
                <dl className="mt-4 grid gap-3 text-sm leading-6 text-muted">
                  <div><dt className="font-extrabold text-ink">What happens</dt><dd>{mistake.happens}</dd></div>
                  <div><dt className="font-extrabold text-ink">Likely cause</dt><dd>{mistake.cause}</dd></div>
                  <div><dt className="font-extrabold text-ink">What to do now</dt><dd>{mistake.now}</dd></div>
                  <div><dt className="font-extrabold text-ink">Change next time</dt><dd>{mistake.next}</dd></div>
                </dl>
              </article>
            ))}
          </div>
          <Link href="/guide/pizza-troubleshooting" className="mt-5 inline-flex min-h-12 items-center justify-center rounded-full bg-ink px-5 text-sm font-extrabold text-white shadow-soft transition hover:-translate-y-0.5 hover:bg-forest">
            Open the Pizza Troubleshooting Guide
          </Link>
        </section>

        <section className="mt-16 rounded-[2rem] border border-ink/10 bg-flour p-5 shadow-soft sm:p-8" aria-labelledby="storage-title">
          <p className="text-xs font-extrabold uppercase tracking-[.2em] text-tomato">Storage and food safety</p>
          <h2 id="storage-title" className="mt-3 font-display text-4xl font-semibold">
            Keep sauce clean, cold and clearly dated.
          </h2>
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <ul className="space-y-2 text-sm leading-7 text-muted">
              <li>Refrigerate promptly in a clean covered container.</li>
              <li>Keep raw tomato sauce cold until use.</li>
              <li>Avoid repeatedly warming and cooling the same batch.</li>
              <li>Use clean utensils and divide large batches into smaller containers when useful.</li>
            </ul>
            <ul className="space-y-2 text-sm leading-7 text-muted">
              <li>Label the preparation date.</li>
              <li>Freeze excess when appropriate.</li>
              <li>Discard sauce showing spoilage, fermentation, mold, off odors or unsafe handling history.</li>
              <li>USDA leftover guidance uses 3–4 days refrigerated or 3–4 months frozen as a general safety reference.</li>
            </ul>
          </div>
        </section>

        <section className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-labelledby="related-title">
          <div className="sm:col-span-2 lg:col-span-3">
            <p className="text-xs font-extrabold uppercase tracking-[.2em] text-tomato">Related learning</p>
            <h2 id="related-title" className="mt-3 font-display text-4xl font-semibold">Keep the sauce connected to the whole pizza.</h2>
          </div>
          {relatedLinks.map(([title, href, body]) => (
            <Link key={href} href={href} className="rounded-[1.5rem] border border-ink/10 bg-card p-5 shadow-soft transition hover:-translate-y-1 hover:shadow-card">
              <h3 className="text-base font-extrabold">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted">{body}</p>
            </Link>
          ))}
        </section>

        <section className="mt-16 rounded-[2rem] bg-tomato p-6 text-white shadow-card sm:p-10 lg:grid lg:grid-cols-[1fr_auto] lg:items-center lg:gap-8">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[.2em] text-white/70">Ready to use the sauce in a real pizza plan?</p>
            <h2 className="mt-3 font-display text-4xl font-semibold sm:text-5xl">Plan my next pizza with the sauce in mind.</h2>
          </div>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row lg:mt-0">
            <Link href="/session/start" className="inline-flex min-h-12 items-center justify-center rounded-full bg-white px-6 text-sm font-extrabold text-tomato shadow-soft transition hover:-translate-y-0.5 hover:bg-flour">
              Plan my next pizza
            </Link>
            <Link href="/guide" className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/35 px-6 text-sm font-extrabold text-white transition hover:-translate-y-0.5 hover:bg-white/10">
              Return to the Pizza Learning Center
            </Link>
          </div>
        </section>

        <section className="mt-12 rounded-[1.5rem] border border-ink/10 bg-card p-5 shadow-soft" aria-labelledby="sources-title">
          <h2 id="sources-title" className="font-display text-2xl font-semibold">Sources and methodology</h2>
          <p className="mt-3 text-sm leading-7 text-muted">
            Traditional Neapolitan claims are based on AVPN regulations and preparation guidance. Practical adaptations
            are labeled as DoughTools recommendations or expert-style adaptations. Food-safety timing uses USDA leftover
            guidance. See <code className="rounded bg-flour px-1 py-0.5">docs/research/pizza-sauce-sources.md</code> for
            concise source notes.
          </p>
        </section>

        <footer className="mt-12 border-t border-ink/10 py-6">
          <AppSignature />
        </footer>
      </div>
    </main>
  );
}
