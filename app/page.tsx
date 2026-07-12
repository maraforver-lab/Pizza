import Link from "next/link";
import Image, { getImageProps } from "next/image";
import ContinuePizzaSessionCard from "@/components/ContinuePizzaSessionCard";
import HomeCalculatorWorkspace from "@/components/HomeCalculatorWorkspace";
import HomepageGuidanceLevelSection from "@/components/HomepageGuidanceLevelSection";
import { DoughToolsIcon, type DoughToolsIconName } from "@/components/icons";
import { homepageContent } from "@/lib/homepage";

type HomePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

type JourneyStage = {
  title: string;
  text: string;
  icon: DoughToolsIconName;
};

type ProductMoment = {
  title: string;
  label: string;
  text: string;
  image: string;
  alt: string;
  stats: string[];
};

function calculatorViewFor(params: Record<string, string | string[] | undefined> | undefined) {
  if (!params) return null;

  const keys = Object.keys(params);
  if (keys.length === 0) return null;
  if (keys.length === 1 && params.calculator !== undefined) return params.calculator === "2" ? "guided" : "entry";

  return "full";
}

const heroValueStatements = ["Know when to start", "Know what to buy", "Know what to do next"];

const heroSessionRows = [
  { label: "Recipe", value: "6 × 260 g dough balls" },
  { label: "Shopping", value: "Flour, tomatoes, mozzarella, basil" },
  { label: "Timeline", value: "Mix Friday · bake Saturday" },
  { label: "Kitchen Mode", value: "One clear action at a time" },
  { label: "Review", value: "Remember what worked" },
];

const journeyStages: JourneyStage[] = [
  {
    title: "Plan",
    text: "Start with the pizza night you want, then get a recipe that fits it.",
    icon: "calendar",
  },
  {
    title: "Shop",
    text: "Turn the plan into a practical list before you buy ingredients.",
    icon: "shopping-basket",
  },
  {
    title: "Prepare",
    text: "Know when to mix, rest, ball and preheat without juggling notes.",
    icon: "timeline",
  },
  {
    title: "Bake",
    text: "Follow the current kitchen action when the oven is hot.",
    icon: "kitchen-mode",
  },
  {
    title: "Improve",
    text: "Capture what happened so the next pizza night is easier.",
    icon: "history",
  },
];

const productMoments: ProductMoment[] = [
  {
    title: "Dough Plan",
    label: "Recipe",
    text: "Ingredient amounts, dough-ball size, yeast and fermentation guidance stay in one readable plan.",
    image: "/dough-guide/guide-step-02-measure.webp",
    alt: "Measured pizza dough ingredients prepared for a dough plan",
    stats: ["Flour 950 g", "6 balls", "24 h cold"],
  },
  {
    title: "Shopping",
    label: "Menu",
    text: "Pizza choices become a shopping checklist, not a separate calculation you have to rebuild.",
    image: "/images/shopping/pizza-margherita.webp",
    alt: "Fresh Margherita pizza representing the shopping and pizza menu flow",
    stats: ["Dough", "Sauce", "Toppings"],
  },
  {
    title: "Timeline",
    label: "Timing",
    text: "The plan becomes clock-time steps for mixing, fermenting, preheating and baking.",
    image: "/images/timeline/preheat-oven.webp",
    alt: "A warm pizza oven preheating for the timeline step",
    stats: ["Mix", "Ball", "Preheat"],
  },
  {
    title: "Kitchen Mode",
    label: "Now",
    text: "During the bake, the interface narrows down to the current action and what comes next.",
    image: "/images/timeline/bake-pizza.webp",
    alt: "Pizza baking in a hot oven for Kitchen Mode guidance",
    stats: ["Current step", "Done when", "Next action"],
  },
];

export default async function Home({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const calculatorView = calculatorViewFor(params);

  if (calculatorView) {
    return <HomeCalculatorWorkspace variant={calculatorView} />;
  }

  const {
    props: { srcSet: desktopHeroSrcSet, sizes: desktopHeroSizes },
  } = getImageProps({
    src: "/images/homepage/doughtools-hero-desktop.webp",
    alt: "Finished pizza with prepared dough in a warm pizza-making workspace",
    width: 2400,
    height: 1500,
    sizes: "62vw",
    priority: true,
  });
  const { props: mobileHeroImageProps } = getImageProps({
    src: "/images/homepage/doughtools-hero-mobile.webp",
    alt: "Finished pizza with prepared dough in a warm pizza-making workspace",
    width: 1200,
    height: 1600,
    sizes: "(max-width: 1023px) 100vw, 38vw",
    priority: true,
  });

  return (
    <main className="min-h-screen overflow-x-clip bg-[radial-gradient(circle_at_12%_0%,rgba(233,75,46,0.10),transparent_32rem),linear-gradient(180deg,#fff8f1_0%,#f1e6d8_42%,#fff8f1_100%)] text-ink">
      <section className="px-4 pb-10 pt-7 sm:px-6 sm:pb-16 sm:pt-12 lg:px-8" aria-labelledby="homepage-hero-heading">
        <div className="mx-auto max-w-7xl">
          <div className="relative overflow-hidden rounded-[2rem] border border-white/80 bg-white/70 shadow-card backdrop-blur sm:rounded-[2.75rem] lg:min-h-[45rem]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(232,201,138,0.26),transparent_26rem)]" aria-hidden="true" />
            <div className="relative z-10 grid gap-7 p-5 sm:p-8 lg:grid-cols-[minmax(0,0.88fr)_minmax(24rem,0.9fr)] lg:items-center lg:p-10 lg:pb-14">
              <div className="max-w-3xl">
                <p className="text-xs font-extrabold uppercase tracking-[.34em] text-tomato">
                  {homepageContent.hero.eyebrow}
                </p>
                <h1 id="homepage-hero-heading" className="mt-5 font-display text-[clamp(3.05rem,11vw,5rem)] font-semibold leading-[.9] tracking-[-.04em] text-ink sm:text-7xl lg:text-[5.9rem]">
                  {homepageContent.hero.h1}
                </h1>
                <p className="mt-6 max-w-2xl text-base leading-7 text-ink/72 sm:text-xl sm:leading-8">
                  {homepageContent.hero.intro}
                </p>
                <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <Link
                    href={homepageContent.hero.primaryCta.href}
                    className="inline-flex min-h-14 items-center justify-center rounded-2xl bg-tomato px-7 py-3 text-base font-extrabold text-white shadow-lg shadow-tomato/20 transition hover:bg-forest active:scale-[.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
                  >
                    {homepageContent.hero.primaryCta.label} →
                  </Link>
                  <a
                    href={homepageContent.hero.secondaryCta.href}
                    className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-ink/10 bg-white/75 px-6 py-3 text-sm font-extrabold text-ink transition hover:border-ink/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
                  >
                    {homepageContent.hero.secondaryCta.label}
                  </a>
                </div>
                <ul className="mt-6 grid gap-2 text-sm font-extrabold text-ink/72 sm:grid-cols-3" aria-label="DoughTools helps you">
                  {heroValueStatements.map((statement) => (
                    <li key={statement} className="flex items-center gap-2 rounded-2xl bg-white/65 px-3 py-2">
                      <DoughToolsIcon name="success" size={16} className="shrink-0 text-leaf" aria-hidden="true" />
                      <span>{statement}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="relative min-w-0 lg:min-h-[35rem]">
                <div className="relative overflow-hidden rounded-[1.75rem] bg-flour shadow-card lg:absolute lg:inset-x-0 lg:bottom-0 lg:top-0">
                  <picture>
                    <source media="(min-width: 1024px)" srcSet={desktopHeroSrcSet} sizes={desktopHeroSizes} />
                    <img
                      {...mobileHeroImageProps}
                      alt="Finished pizza with prepared dough in a warm pizza-making workspace"
                      className="h-[19rem] w-full object-cover object-[50%_62%] sm:h-[25rem] lg:h-full lg:object-[66%_center]"
                    />
                  </picture>
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,61,46,0)_34%,rgba(15,61,46,0.48)_100%)]" />
                </div>

                <section
                  className="relative mt-4 w-full rounded-[1.75rem] border border-white/80 bg-white/92 p-4 shadow-card backdrop-blur-md sm:p-5 lg:absolute lg:left-0 lg:top-8 lg:mt-0 lg:max-w-[24rem]"
                  aria-labelledby="homepage-session-preview"
                >
                  <p className="text-xs font-extrabold uppercase tracking-[.24em] text-leaf">Pizza Session preview</p>
                  <h2 id="homepage-session-preview" className="mt-2 font-display text-2xl font-semibold leading-none">
                    One connected plan.
                  </h2>
                  <dl className="mt-4 grid gap-2">
                    {heroSessionRows.map((row) => (
                      <div key={row.label} className="grid grid-cols-[5.9rem_1fr] gap-3 rounded-2xl bg-cream/80 px-3 py-2.5 text-sm">
                        <dt className="font-extrabold text-ink/45">{row.label}</dt>
                        <dd className="min-w-0 font-extrabold leading-5 text-ink">{row.value}</dd>
                      </div>
                    ))}
                  </dl>
                </section>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto mt-8 max-w-7xl">
          <ContinuePizzaSessionCard variant="hero" />
        </div>
      </section>

      <section id="how-it-works" className="px-4 py-10 sm:px-6 sm:py-16 lg:px-8" aria-labelledby="homepage-journey-heading">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-5 lg:grid-cols-[0.72fr_1fr] lg:items-end">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[.28em] text-tomato">How it works</p>
              <h2 id="homepage-journey-heading" className="mt-3 font-display text-4xl font-semibold leading-none sm:text-5xl">
                One plan. Every step.
              </h2>
            </div>
            <p className="text-base leading-7 text-ink/70">
              Great pizza starts long before the oven. DoughTools keeps the whole path visible, from the first idea to what you learn after the bake.
            </p>
          </div>
          <div className="mt-8 grid gap-3 lg:grid-cols-5">
            {journeyStages.map((stage, index) => (
              <article key={stage.title} className="relative rounded-[1.5rem] border border-white/80 bg-white/82 p-5 shadow-sm">
                {index > 0 && (
                  <span className="absolute -left-4 top-1/2 hidden h-px w-5 bg-ink/12 lg:block" aria-hidden="true" />
                )}
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-leaf/10 text-leaf" aria-hidden="true">
                  <DoughToolsIcon name={stage.icon} size={24} />
                </span>
                <p className="mt-5 text-xs font-extrabold uppercase tracking-[.22em] text-ink/35">Step {index + 1}</p>
                <h3 className="mt-2 font-display text-3xl font-semibold leading-none">{stage.title}</h3>
                <p className="mt-3 text-sm leading-6 text-ink/62">{stage.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-10 sm:px-6 sm:py-16 lg:px-8" aria-labelledby="homepage-more-than-calculator-heading">
        <div className="mx-auto grid max-w-7xl gap-7 rounded-[2rem] bg-forest-dark p-5 text-white shadow-card sm:rounded-[2.5rem] sm:p-8 lg:grid-cols-[0.75fr_1fr] lg:items-center">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[.28em] text-oven-gold">Why it feels different</p>
            <h2 id="homepage-more-than-calculator-heading" className="mt-3 font-display text-4xl font-semibold leading-none sm:text-5xl">
              More than a dough calculator.
            </h2>
            <p className="mt-4 max-w-xl text-base leading-7 text-white/72">
              A calculator can tell you what goes into the bowl. DoughTools helps you understand the evening around the dough: what to buy, when to start, what to do next, and what to remember for next time.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <article className="rounded-[1.5rem] border border-white/10 bg-white/10 p-5">
              <p className="text-xs font-extrabold uppercase tracking-[.22em] text-white/45">Normal calculator</p>
              <h3 className="mt-3 font-display text-3xl font-semibold leading-none">Ingredients.</h3>
              <p className="mt-3 text-sm leading-6 text-white/62">Useful numbers, but the real-life planning is still left for you to connect.</p>
            </article>
            <article className="rounded-[1.5rem] border border-oven-gold/35 bg-oven-gold/12 p-5">
              <p className="text-xs font-extrabold uppercase tracking-[.22em] text-oven-gold">DoughTools</p>
              <h3 className="mt-3 font-display text-3xl font-semibold leading-none">Recipe → shopping → timeline → kitchen → review.</h3>
              <p className="mt-3 text-sm leading-6 text-white/72">A connected workflow that turns pizza night into something you can actually follow.</p>
            </article>
          </div>
        </div>
      </section>

      <section className="px-4 py-10 sm:px-6 sm:py-16 lg:px-8" aria-labelledby="homepage-product-action-heading">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-xs font-extrabold uppercase tracking-[.28em] text-leaf">See DoughTools in action</p>
            <h2 id="homepage-product-action-heading" className="mt-3 font-display text-4xl font-semibold leading-none sm:text-5xl">
              A real working flow, not a decorative mockup.
            </h2>
            <p className="mt-4 text-base leading-7 text-ink/70">
              Each part of the session is designed to answer the practical question that comes next.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {productMoments.map((moment) => (
              <article key={moment.title} className="overflow-hidden rounded-[1.75rem] border border-white/80 bg-white/85 shadow-card">
                <Image
                  src={moment.image}
                  alt={moment.alt}
                  width={900}
                  height={675}
                  sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 25vw"
                  className="h-44 w-full object-cover"
                />
                <div className="p-5">
                  <p className="text-xs font-extrabold uppercase tracking-[.22em] text-tomato">{moment.label}</p>
                  <h3 className="mt-2 font-display text-3xl font-semibold leading-none">{moment.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-ink/62">{moment.text}</p>
                  <ul className="mt-4 grid gap-2 text-xs font-extrabold text-ink/58" aria-label={`${moment.title} product details`}>
                    {moment.stats.map((stat) => (
                      <li key={stat} className="rounded-2xl bg-cream/70 px-3 py-2">{stat}</li>
                    ))}
                  </ul>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-10 sm:px-6 sm:py-16 lg:px-8" aria-labelledby="homepage-experience-heading">
        <div className="mx-auto grid max-w-7xl gap-6 rounded-[2rem] border border-white/80 bg-white/72 p-5 shadow-card sm:rounded-[2.5rem] sm:p-7 lg:grid-cols-[0.76fr_1fr] lg:items-center">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[.28em] text-tomato">Guidance for every level</p>
            <h2 id="homepage-experience-heading" className="mt-3 font-display text-4xl font-semibold leading-none sm:text-5xl">
              Same engine. Different guidance.
            </h2>
            <div className="mt-5 grid gap-3 text-sm leading-6 text-ink/65 sm:grid-cols-3 lg:grid-cols-1">
              <p><strong className="text-ink">Beginner:</strong> clear next steps and safe defaults.</p>
              <p><strong className="text-ink">Enthusiast:</strong> more explanation and practical control.</p>
              <p><strong className="text-ink">Pizza Nerd:</strong> deeper context without changing the math.</p>
            </div>
            <p className="mt-4 rounded-2xl bg-cream/70 p-4 text-sm font-bold leading-6 text-ink/58">
              The calculations stay the same. The explanation changes.
            </p>
          </div>
          <HomepageGuidanceLevelSection />
        </div>
      </section>

      <section className="px-4 py-10 sm:px-6 sm:py-16 lg:px-8" aria-labelledby="homepage-founder-heading">
        <div className="mx-auto grid max-w-7xl gap-6 rounded-[2rem] bg-[linear-gradient(135deg,#fff8f1_0%,#ffffff_48%,#f1e6d8_100%)] p-5 shadow-card sm:rounded-[2.5rem] sm:p-8 lg:grid-cols-[0.84fr_1fr] lg:items-center">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[.28em] text-tomato">Founder story</p>
            <h2 id="homepage-founder-heading" className="mt-3 font-display text-4xl font-semibold leading-none sm:text-5xl">
              Built because pizza planning kept getting in the way of pizza night.
            </h2>
          </div>
          <div className="space-y-4 text-base leading-7 text-ink/70">
            <p>
              DoughTools grew from a simple frustration: the dough numbers were only part of the problem. The harder part was knowing when to start, how to prepare, and how to stay calm once people were waiting for pizza.
            </p>
            <p>
              It is built by Marcin as a practical companion for better pizza nights — transparent enough to trust, focused enough to use, and still respectful of the craft.
            </p>
            <Link
              href="/about"
              className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-ink/10 bg-white/80 px-5 py-3 text-sm font-extrabold text-ink transition hover:border-ink/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
            >
              Read the founder story
            </Link>
          </div>
        </div>
      </section>

      <section className="px-4 py-12 sm:px-6 sm:py-16 lg:px-8" aria-labelledby="homepage-final-cta-heading">
        <div className="mx-auto max-w-5xl rounded-[2rem] border border-white/80 bg-ink p-6 text-center text-white shadow-card sm:rounded-[2.5rem] sm:p-10">
          <p className="text-xs font-extrabold uppercase tracking-[.28em] text-oven-gold">Ready when you are</p>
          <h2 id="homepage-final-cta-heading" className="mt-3 font-display text-4xl font-semibold leading-none sm:text-6xl">
            Ready to plan your next pizza?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-white/72 sm:text-base sm:leading-7">
            Start your first Pizza Session and let DoughTools turn the pizza you want into a plan you can follow.
          </p>
          <Link
            href={homepageContent.hero.primaryCta.href}
            className="mt-7 inline-flex min-h-14 w-full items-center justify-center rounded-2xl bg-tomato px-7 py-3 text-base font-extrabold text-white shadow-lg shadow-tomato/20 transition hover:bg-white hover:text-ink active:scale-[.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-ink sm:w-auto"
          >
            {homepageContent.hero.primaryCta.label} →
          </Link>
        </div>
      </section>

      <footer className="px-4 pb-10 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 border-t border-ink/10 pt-6 text-xs font-bold text-ink/45 sm:flex-row sm:items-center sm:justify-between">
          <p>Made for better pizza nights.</p>
          <nav className="flex flex-wrap gap-4" aria-label="Footer">
            <Link href="/guide" className="hover:text-ink">Guide</Link>
            <Link href="/about" className="hover:text-ink">About</Link>
            <Link href="/privacy" className="hover:text-ink">Privacy</Link>
            <Link href="/terms" className="hover:text-ink">Terms</Link>
          </nav>
        </div>
      </footer>
    </main>
  );
}
