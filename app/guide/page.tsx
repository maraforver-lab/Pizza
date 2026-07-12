import Image from "next/image";
import Link from "next/link";
import AppSignature from "@/components/AppSignature";
import { DoughToolsIcon, type DoughToolsIconName } from "@/components/icons";

type ProblemEntry = {
  title: string;
  description: string;
  href: string;
  icon: DoughToolsIconName;
};

type Concept = {
  id: string;
  icon: DoughToolsIconName;
  name: string;
  definition: string;
  why: string;
  effect: string;
  commonIssue: string;
  next: string;
  related: Array<{ label: string; href: string }>;
  action?: { label: string; href: string };
};

const problemEntries: ProblemEntry[] = [
  {
    title: "My dough is sticky",
    description: "Understand hydration, flour absorption, temperature, and handling.",
    href: "#hydration",
    icon: "water",
  },
  {
    title: "My dough will not stretch",
    description: "Learn how gluten strength, temperature, and resting affect extensibility.",
    href: "#gluten-development",
    icon: "wheat",
  },
  {
    title: "My crust is dense",
    description: "Check fermentation, dough handling, flour strength, and baking heat.",
    href: "#fermentation",
    icon: "timer",
  },
  {
    title: "My dough spreads or collapses",
    description: "Learn how over-fermentation, weak flour, and temperature affect structure.",
    href: "#fermentation",
    icon: "warning",
  },
  {
    title: "I do not know which flour to choose",
    description: "Understand flour type, protein, W strength, and fermentation fit.",
    href: "#flour-strength",
    icon: "wheat",
  },
  {
    title: "I use a home oven",
    description: "Learn how lower heat changes dough, toppings, preheating, and bake time.",
    href: "#oven-heat",
    icon: "oven",
  },
  {
    title: "I want a lighter, airier crust",
    description: "Understand the combined effect of hydration, strength, fermentation, handling, and heat.",
    href: "#hydration-comparison",
    icon: "experience-level",
  },
  {
    title: "I am confused by pizza percentages",
    description: "Learn baker’s percentages through one concrete recipe example.",
    href: "#bakers-percentages",
    icon: "scale",
  },
];

const concepts: Concept[] = [
  {
    id: "hydration",
    icon: "water",
    name: "Hydration",
    definition: "The amount of water compared with flour.",
    why: "It changes how soft, sticky, extensible, and open the dough can become.",
    effect: "Higher hydration can create a lighter structure, but only when the flour, fermentation, handling, and oven support it.",
    commonIssue: "Adding water without enough flour strength or handling skill can make dough feel messy rather than airy.",
    next: "Change hydration together with flour, fermentation, and the way you handle the dough.",
    related: [
      { label: "Flour strength", href: "#flour-strength" },
      { label: "Gluten development", href: "#gluten-development" },
      { label: "Fermentation", href: "#fermentation" },
      { label: "Oven heat", href: "#oven-heat" },
    ],
    action: { label: "Use the Quick Dough Calculator", href: "/calculator/quick" },
  },
  {
    id: "fermentation",
    icon: "timer",
    name: "Fermentation",
    definition: "The period when yeast and enzymes change the dough’s flavour, gas, and handling.",
    why: "It affects rise, flavour, extensibility, strength, and timing.",
    effect: "More time can improve flavour and openness, but too much time or warmth can weaken the dough.",
    commonIssue: "Clock time alone can mislead you if temperature, flour strength, or dough condition is different.",
    next: "Use time as a plan, then check the dough’s condition before stretching.",
    related: [
      { label: "Dough temperature", href: "#dough-temperature" },
      { label: "Yeast", href: "#yeast" },
      { label: "Flour strength", href: "#flour-strength" },
    ],
    action: { label: "Open the Dough Guide", href: "/guides/dough" },
  },
  {
    id: "dough-temperature",
    icon: "thermometer",
    name: "Dough temperature",
    definition: "How warm or cool the dough actually is while it ferments.",
    why: "Temperature changes fermentation speed more than many people expect.",
    effect: "Warmer dough moves faster; colder dough moves more slowly and may need more time.",
    commonIssue: "A room-temperature plan can behave differently if the room is much warmer or cooler than expected.",
    next: "Think about the dough’s real environment, not only the recipe’s written time.",
    related: [
      { label: "Fermentation", href: "#fermentation" },
      { label: "Yeast", href: "#yeast" },
      { label: "Oven heat", href: "#oven-heat" },
    ],
  },
  {
    id: "flour-strength",
    icon: "wheat",
    name: "Flour strength",
    definition: "How much structure the flour can build and hold during mixing and fermentation.",
    why: "It affects how much water, time, and handling the dough can support.",
    effect: "Stronger flour can tolerate longer fermentation and more water, but it can also feel tighter if the plan does not need it.",
    commonIssue: "Choosing flour by type name alone, such as 00, does not tell you the full strength story.",
    next: "Match flour strength to fermentation time, hydration, and the pizza style you want.",
    related: [
      { label: "Hydration", href: "#hydration" },
      { label: "Gluten development", href: "#gluten-development" },
      { label: "Fermentation", href: "#fermentation" },
    ],
  },
  {
    id: "gluten-development",
    icon: "wheat",
    name: "Gluten development",
    definition: "The structure that forms when flour and water are mixed, rested, folded, or kneaded.",
    why: "It helps the dough hold gas while still stretching into a pizza base.",
    effect: "More development can add strength; rest can make tight dough more extensible.",
    commonIssue: "A dough that tears or resists stretching may need rest, not more force.",
    next: "Build enough strength early, then let rest and fermentation make the dough easier to open.",
    related: [
      { label: "Hydration", href: "#hydration" },
      { label: "Flour strength", href: "#flour-strength" },
      { label: "Ball weight and pizza size", href: "#ball-weight" },
    ],
    action: { label: "Learn the dough steps", href: "/guides/dough?step=develop-dough" },
  },
  {
    id: "yeast",
    icon: "yeast",
    name: "Yeast",
    definition: "The leavening that produces gas and helps the dough rise over time.",
    why: "The amount and type affect how quickly the dough reaches the right condition.",
    effect: "More yeast moves faster; less yeast gives a longer runway, especially with cooler fermentation.",
    commonIssue: "Too much yeast for the time and temperature can push the dough past its best point.",
    next: "Adjust yeast with fermentation time and temperature rather than treating it as a fixed amount.",
    related: [
      { label: "Fermentation", href: "#fermentation" },
      { label: "Dough temperature", href: "#dough-temperature" },
      { label: "Salt", href: "#salt" },
    ],
  },
  {
    id: "salt",
    icon: "salt",
    name: "Salt",
    definition: "A small ingredient that affects flavour, structure, and fermentation speed.",
    why: "It makes pizza taste complete and helps tighten the dough structure.",
    effect: "More salt can slow fermentation and strengthen feel; too little can taste flat and ferment quickly.",
    commonIssue: "Salt cannot fully rescue weak flour or a plan that is too warm and long.",
    next: "Use salt as part of the dough balance, not as the only control lever.",
    related: [
      { label: "Yeast", href: "#yeast" },
      { label: "Fermentation", href: "#fermentation" },
      { label: "Baker’s percentages", href: "#bakers-percentages" },
    ],
  },
  {
    id: "ball-weight",
    icon: "scale",
    name: "Ball weight and pizza size",
    definition: "How much dough is used for each pizza.",
    why: "It changes thickness, diameter, rim size, and how easy the pizza is to handle.",
    effect: "A heavier ball can make a larger or thicker pizza; a lighter ball can feel thinner and more delicate.",
    commonIssue: "Changing diameter without changing ball weight can make the pizza feel unexpectedly thin or heavy.",
    next: "Choose ball weight together with the pizza style and the size you want to bake.",
    related: [
      { label: "Hydration", href: "#hydration" },
      { label: "Oven heat", href: "#oven-heat" },
      { label: "Baker’s percentages", href: "#bakers-percentages" },
    ],
    action: { label: "Calculate a quick recipe", href: "/calculator/quick" },
  },
  {
    id: "oven-heat",
    icon: "flame",
    name: "Oven heat and bake profile",
    definition: "The heat available from the oven, baking surface, and bake time.",
    why: "It affects rise, browning, topping moisture, and whether the base sets before the crust dries.",
    effect: "A hot pizza oven bakes quickly; a home oven usually needs longer preheating and a different topping balance.",
    commonIssue: "Using pizza-oven assumptions in a home oven can leave the base pale or soft.",
    next: "Match dough, toppings, surface, and timing to the oven you actually use.",
    related: [
      { label: "Hydration", href: "#hydration" },
      { label: "Ball weight and pizza size", href: "#ball-weight" },
      { label: "Fermentation", href: "#fermentation" },
    ],
    action: { label: "Troubleshoot baking problems", href: "/guide/pizza-troubleshooting" },
  },
  {
    id: "bakers-percentages",
    icon: "scale",
    name: "Baker’s percentages",
    definition: "A recipe language where flour is 100% and other ingredients are compared with flour weight.",
    why: "It makes recipes easier to scale without changing their balance.",
    effect: "The percentages describe the dough’s relationships; the gram amounts change with pizza count and ball weight.",
    commonIssue: "A percentage is not a serving size. It only becomes a recipe after the total dough target is chosen.",
    next: "Use percentages to understand the formula, then calculate the actual grams you need.",
    related: [
      { label: "Hydration", href: "#hydration" },
      { label: "Salt", href: "#salt" },
      { label: "Ball weight and pizza size", href: "#ball-weight" },
    ],
    action: { label: "Try it in the calculator", href: "/calculator/quick" },
  },
];

const journey = [
  { label: "Plan", text: "Choose the pizza, timing, oven, and dough direction.", icon: "calendar" },
  { label: "Shop", text: "Turn the plan into a practical shopping list.", icon: "shopping-basket" },
  { label: "Prepare", text: "Follow the dough work at the right time.", icon: "kitchen-mode" },
  { label: "Bake", text: "Use the oven profile that fits your setup.", icon: "oven" },
  { label: "Improve", text: "Review what happened and adjust the next bake.", icon: "history" },
] as const satisfies Array<{ label: string; text: string; icon: DoughToolsIconName }>;

export default function Guide() {
  return (
    <main className="min-h-screen overflow-x-clip bg-warm-background text-ink">
      <section className="relative overflow-hidden bg-forest-dark text-white">
        <div className="absolute inset-0 opacity-65">
          <Image
            src="/images/homepage/doughtools-hero-desktop.webp"
            alt="Finished pizza beside prepared dough on a warm kitchen work surface"
            fill
            priority
            sizes="100vw"
            className="object-cover object-[58%_center]"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/72 to-ink/20" aria-hidden="true" />
        </div>
        <div className="relative mx-auto grid max-w-7xl gap-8 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[minmax(0,0.82fr)_minmax(20rem,0.58fr)] lg:px-8 lg:py-24">
          <div className="max-w-3xl">
            <p className="text-xs font-extrabold uppercase tracking-[.24em] text-oven-gold">Pizza Learning Center</p>
            <h1 className="mt-5 font-display text-5xl font-semibold leading-[0.95] tracking-tight sm:text-6xl lg:text-7xl">
              Understand your dough. Make better pizza.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-white/78 sm:text-lg">
              Learn what hydration, fermentation, flour strength, temperature, and baking really change — with clear
              explanations, visual comparisons, and practical next steps.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href="#essential-concepts"
                className="inline-flex min-h-12 items-center justify-center rounded-full bg-tomato px-6 text-sm font-extrabold text-white shadow-card transition hover:-translate-y-0.5 hover:bg-tomato-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
              >
                Explore the essentials
              </a>
              <a
                href="#problem-led-entry"
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/35 bg-white/10 px-6 text-sm font-extrabold text-white backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/18 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
              >
                Solve a pizza problem
              </a>
            </div>
          </div>
          <div className="rounded-[2rem] border border-white/18 bg-white/10 p-5 shadow-card backdrop-blur-md lg:self-end">
            <p className="text-xs font-extrabold uppercase tracking-[.2em] text-oven-gold">Learning without guesswork</p>
            <p className="mt-3 text-sm leading-6 text-white/76">
              Use this page when you want the why. Use the Dough Guide when you want the step-by-step method. Use
              Troubleshooting when something has gone wrong.
            </p>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <section id="problem-led-entry" className="scroll-mt-24" aria-labelledby="problem-led-title">
          <div className="max-w-3xl">
            <p className="text-xs font-extrabold uppercase tracking-[.2em] text-tomato">Start with the real question</p>
            <h2 id="problem-led-title" className="mt-3 font-display text-4xl font-semibold sm:text-5xl">
              What do you want to understand?
            </h2>
            <p className="mt-4 text-sm leading-7 text-ink/62 sm:text-base">
              You do not need to know the technical term first. Start with the thing you are seeing, then learn which
              dough variables are usually involved.
            </p>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {problemEntries.map((entry) => (
              <Link
                key={entry.title}
                href={entry.href}
                className="group rounded-[1.5rem] border border-ink/10 bg-card p-5 shadow-soft transition hover:-translate-y-1 hover:border-tomato/30 hover:shadow-card focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-tomato"
              >
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-tomato/10 text-tomato" aria-hidden="true">
                  <DoughToolsIcon name={entry.icon} size={24} />
                </span>
                <h3 className="mt-5 text-base font-extrabold text-ink">{entry.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted">{entry.description}</p>
                <span className="mt-4 inline-flex text-xs font-extrabold text-tomato transition group-hover:text-ink">
                  Learn what affects it →
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-16 rounded-[2rem] bg-forest-dark p-5 text-white shadow-card sm:p-8 lg:p-10" aria-labelledby="learning-journey-title">
          <div className="grid gap-8 lg:grid-cols-[0.78fr_1.22fr] lg:items-center">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[.2em] text-oven-gold">From learning to doing</p>
              <h2 id="learning-journey-title" className="mt-3 font-display text-4xl font-semibold sm:text-5xl">
                One plan. Every step.
              </h2>
              <p className="mt-4 text-sm leading-7 text-white/68">
                Concepts matter because they change decisions in the kitchen: when to start, what to buy, how to handle
                the dough, and what to adjust next time.
              </p>
            </div>
            <ol className="grid gap-3 sm:grid-cols-5">
              {journey.map((step, index) => (
                <li key={step.label} className="rounded-[1.35rem] border border-white/12 bg-white/8 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <DoughToolsIcon name={step.icon} className="text-oven-gold" size={24} />
                    <span className="text-xs font-extrabold text-white/45">0{index + 1}</span>
                  </div>
                  <h3 className="mt-4 text-sm font-extrabold">{step.label}</h3>
                  <p className="mt-2 text-xs leading-5 text-white/62">{step.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="essential-concepts" className="mt-16 scroll-mt-24" aria-labelledby="essential-concepts-title">
          <div className="grid gap-8 lg:grid-cols-[0.6fr_1.4fr] lg:items-end">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[.2em] text-tomato">Practical glossary</p>
              <h2 id="essential-concepts-title" className="mt-3 font-display text-4xl font-semibold sm:text-5xl">
                The essentials behind better pizza
              </h2>
            </div>
            <p className="text-sm leading-7 text-ink/62 sm:text-base">
              Each concept is short on purpose: what it means, why it matters, what changes in real dough, and where to
              go next when you need deeper instruction.
            </p>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            {concepts.map((concept) => (
              <article
                key={concept.id}
                id={concept.id}
                className="scroll-mt-24 rounded-[1.75rem] border border-ink/10 bg-card p-5 shadow-soft sm:p-6"
              >
                <div className="flex items-start gap-4">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-leaf/10 text-leaf" aria-hidden="true">
                    <DoughToolsIcon name={concept.icon} size={24} />
                  </span>
                  <div>
                    <h3 className="font-display text-2xl font-semibold">{concept.name}</h3>
                    <p className="mt-2 text-sm leading-6 text-ink/66">{concept.definition}</p>
                  </div>
                </div>
                <dl className="mt-5 grid gap-4 text-sm leading-6">
                  <div>
                    <dt className="font-extrabold text-ink">Why it matters</dt>
                    <dd className="mt-1 text-ink/62">{concept.why}</dd>
                  </div>
                  <div>
                    <dt className="font-extrabold text-ink">Practical effect</dt>
                    <dd className="mt-1 text-ink/62">{concept.effect}</dd>
                  </div>
                </dl>
                <details className="mt-5 rounded-2xl border border-ink/10 bg-flour/70 p-4">
                  <summary className="cursor-pointer text-sm font-extrabold text-ink marker:text-tomato">
                    Learn more
                  </summary>
                  <div className="mt-4 grid gap-4 text-sm leading-6 text-ink/64">
                    <p>
                      <strong className="text-ink">Commonly goes wrong:</strong> {concept.commonIssue}
                    </p>
                    <p>
                      <strong className="text-ink">Consider next:</strong> {concept.next}
                    </p>
                    <div>
                      <strong className="text-ink">Related:</strong>{" "}
                      {concept.related.map((item, index) => (
                        <span key={item.href}>
                          <a className="font-bold text-tomato underline-offset-4 hover:underline" href={item.href}>
                            {item.label}
                          </a>
                          {index < concept.related.length - 1 ? " · " : ""}
                        </span>
                      ))}
                    </div>
                    {concept.action ? (
                      <Link className="w-fit text-sm font-extrabold text-leaf underline-offset-4 hover:underline" href={concept.action.href}>
                        {concept.action.label} →
                      </Link>
                    ) : null}
                  </div>
                </details>
              </article>
            ))}
          </div>
        </section>

        <section id="hydration-comparison" className="mt-16 scroll-mt-24" aria-labelledby="hydration-comparison-title">
          <div className="overflow-hidden rounded-[2rem] border border-ink/10 bg-card shadow-card">
            <div className="grid gap-0 lg:grid-cols-[0.78fr_1.22fr]">
              <div className="relative min-h-[22rem]">
                <Image
                  src="/dough-guide/guide-step-03-mix.webp"
                  alt="Mixed pizza dough showing a soft hydrated texture in a bowl"
                  fill
                  sizes="(max-width: 1024px) 100vw, 42vw"
                  className="object-cover"
                />
              </div>
              <div className="p-5 sm:p-8 lg:p-10">
                <p className="text-xs font-extrabold uppercase tracking-[.2em] text-tomato">Visual comparison</p>
                <h2 id="hydration-comparison-title" className="mt-3 font-display text-4xl font-semibold">
                  Hydration changes feel before it changes results.
                </h2>
                <p className="mt-4 text-sm leading-7 text-ink/64">
                  Water affects firmness, stickiness, extensibility, and potential crumb openness. It does not guarantee
                  an open crust by itself — flour, fermentation, handling, and heat still have to agree.
                </p>
                <div className="mt-6 grid gap-3">
                  {[
                    ["Lower hydration", "Firmer, easier to move, often less extensible.", "Best when you need control or a crisper style."],
                    ["Balanced hydration", "Soft enough to stretch, structured enough to handle.", "Often the calmest starting point for home pizza."],
                    ["Higher hydration", "Stickier and more delicate, with more open-crumb potential.", "Works best with suitable flour, handling, and oven heat."],
                  ].map(([label, description, note], index) => (
                    <article key={label} className="rounded-2xl border border-ink/10 bg-warm-background p-4">
                      <div className="flex items-center gap-3">
                        <span className="h-2.5 rounded-full bg-leaf" style={{ width: `${2.5 + index * 1.75}rem` }} aria-hidden="true" />
                        <h3 className="text-sm font-extrabold">{label}</h3>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-ink/62">{description}</p>
                      <p className="mt-1 text-xs leading-5 text-muted">{note}</p>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-16 grid gap-5 lg:grid-cols-3" aria-labelledby="guide-next-title">
          <div className="lg:col-span-3">
            <p className="text-xs font-extrabold uppercase tracking-[.2em] text-tomato">Go deeper</p>
            <h2 id="guide-next-title" className="mt-3 font-display text-4xl font-semibold">
              Learn the concept, then use the right tool.
            </h2>
          </div>
          <Link href="/guides/dough" className="rounded-[1.75rem] border border-ink/10 bg-card p-6 shadow-soft transition hover:-translate-y-1 hover:shadow-card">
            <DoughToolsIcon name="kitchen-mode" className="text-leaf" size={32} />
            <h3 className="mt-5 font-display text-2xl font-semibold">Pizza Dough Guide</h3>
            <p className="mt-3 text-sm leading-6 text-ink/62">
              Step-by-step dough instruction from measuring and mixing to a dough ball ready for stretching.
            </p>
          </Link>
          <Link href="/guide/pizza-troubleshooting" className="rounded-[1.75rem] border border-ink/10 bg-card p-6 shadow-soft transition hover:-translate-y-1 hover:shadow-card">
            <DoughToolsIcon name="warning" className="text-tomato" size={32} />
            <h3 className="mt-5 font-display text-2xl font-semibold">Pizza Troubleshooting Guide</h3>
            <p className="mt-3 text-sm leading-6 text-ink/62">
              Common pizza dough and baking problems — what causes them, how to fix them now, and how to prevent them next time.
            </p>
          </Link>
          <Link href="/session/start" className="rounded-[1.75rem] border border-ink/10 bg-forest-dark p-6 text-white shadow-card transition hover:-translate-y-1">
            <DoughToolsIcon name="pizza" className="text-oven-gold" size={32} />
            <h3 className="mt-5 font-display text-2xl font-semibold">Turn it into a pizza plan</h3>
            <p className="mt-3 text-sm leading-6 text-white/68">
              Use DoughTools to create the recipe, shopping list, timeline, Kitchen Mode, and review for your next bake.
            </p>
          </Link>
        </section>

        <section className="mt-16 rounded-[2rem] bg-tomato p-6 text-white shadow-card sm:p-10 lg:grid lg:grid-cols-[1fr_auto] lg:items-center lg:gap-8">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[.2em] text-white/70">Ready to use what you learned?</p>
            <h2 className="mt-3 font-display text-4xl font-semibold sm:text-5xl">Plan your next pizza with less guesswork.</h2>
          </div>
          <Link
            href="/session/start"
            className="mt-6 inline-flex min-h-12 items-center justify-center rounded-full bg-white px-6 text-sm font-extrabold text-tomato shadow-soft transition hover:-translate-y-0.5 hover:bg-flour focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white lg:mt-0"
          >
            Start a Pizza Session
          </Link>
        </section>

        <footer className="mt-12 border-t border-ink/10 py-6">
          <AppSignature />
        </footer>
      </div>
    </main>
  );
}
