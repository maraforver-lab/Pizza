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
  image: string;
  alt: string;
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

const heroPromiseRows = [
  { label: "Before", value: "You know when to start, not just what to mix." },
  { label: "During", value: "You follow one calm kitchen action at a time." },
  { label: "After", value: "You remember what made the pizza worth repeating." },
];

const guessworkQuestions = [
  "When should I start?",
  "How much dough do I need?",
  "When should I take it out of the fridge?",
  "What do I need to buy?",
  "What do I do next?",
];

const journeyStages: JourneyStage[] = [
  {
    title: "Plan",
    text: "Start with the pizza night you want, then get a plan that fits real life.",
    icon: "calendar",
    image: "/dough-guide/guide-step-02-measure.webp",
    alt: "Measured ingredients for planning pizza dough",
  },
  {
    title: "Shop",
    text: "Buy with confidence instead of rebuilding the recipe in the store.",
    icon: "shopping-basket",
    image: "/images/shopping/pizza-margherita.webp",
    alt: "Fresh Margherita pizza representing the pizza menu and shopping plan",
  },
  {
    title: "Prepare",
    text: "Know when the dough needs attention and when it simply needs time.",
    icon: "timeline",
    image: "/dough-guide/guide-step-08-ball.webp",
    alt: "Dough balls prepared for the next stage of pizza making",
  },
  {
    title: "Bake",
    text: "Keep the hot, messy part calm with the next action already clear.",
    icon: "kitchen-mode",
    image: "/images/timeline/bake-pizza.webp",
    alt: "Pizza baking in a hot oven",
  },
  {
    title: "Improve",
    text: "Turn one good evening into the starting point for the next one.",
    icon: "history",
    image: "/images/timeline/review-result.webp",
    alt: "Finished pizza ready for review after baking",
  },
];

const productMoments: ProductMoment[] = [
  {
    title: "Dough Plan",
    label: "Recipe",
    text: "The dough numbers become something you can trust before the first bowl comes out.",
    image: "/dough-guide/guide-step-02-measure.webp",
    alt: "Measured pizza dough ingredients prepared for a dough plan",
    stats: ["Flour 950 g", "6 balls", "24 h cold"],
  },
  {
    title: "Shopping",
    label: "Menu",
    text: "The pizzas you want become a clear shopping list, so the fridge is ready too.",
    image: "/images/shopping/pizza-margherita.webp",
    alt: "Fresh Margherita pizza representing the shopping and pizza menu flow",
    stats: ["Dough", "Sauce", "Toppings"],
  },
  {
    title: "Timeline",
    label: "Timing",
    text: "The evening gets a rhythm: mix, wait, ball, preheat and bake at the right moment.",
    image: "/images/timeline/preheat-oven.webp",
    alt: "A warm pizza oven preheating for the timeline step",
    stats: ["Mix", "Ball", "Preheat"],
  },
  {
    title: "Kitchen Mode",
    label: "Now",
    text: "When the oven is hot, DoughTools narrows the noise down to what matters now.",
    image: "/images/timeline/bake-pizza.webp",
    alt: "Pizza baking in a hot oven for Kitchen Mode guidance",
    stats: ["Current step", "Done when", "Next action"],
  },
];

const footerGroups = [
  {
    title: "Learn",
    links: [
      { label: "Learning Center", href: "/guide" },
      { label: "Pizza Sauce", href: "/sauce" },
      { label: "Dough Guide", href: "/guides/dough" },
      { label: "Troubleshooting", href: "/guide/pizza-troubleshooting" },
      { label: "Pizza Styles", href: "/styles" },
      { label: "Ovens", href: "/ovens" },
    ],
  },
  {
    title: "Product",
    links: [
      { label: "Plan my next pizza", href: "/session/start" },
      { label: "Quick Dough Calculator", href: "/calculator/quick" },
      { label: "Party Orders", href: "/account/party-orders" },
      { label: "Costs", href: "/costs" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Updates", href: "/updates" },
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
    ],
  },
] as const;

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
      <section className="px-4 pb-10 pt-7 sm:px-6 sm:pb-16 sm:pt-12 lg:px-8 lg:pb-12 lg:pt-8" aria-labelledby="homepage-hero-heading">
        <div className="mx-auto max-w-7xl">
          <div className="grid min-w-0 overflow-hidden rounded-[2rem] bg-forest-dark shadow-overlay sm:rounded-[2.75rem] lg:min-h-[clamp(34rem,calc(100svh-6rem),40rem)] lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] xl:min-h-[clamp(35rem,calc(100svh-6rem),41rem)] xl:grid-cols-[minmax(0,0.88fr)_minmax(0,1.12fr)]">
            <div className="relative z-10 flex min-w-0 flex-col justify-center p-5 text-white sm:p-8 lg:p-9 xl:p-10">
              <div className="min-w-0 max-w-2xl py-2 lg:py-4 xl:py-6">
                <p className="text-xs font-extrabold uppercase tracking-[.34em] text-oven-gold">
                  {homepageContent.hero.eyebrow}
                </p>
                <h1 id="homepage-hero-heading" className="mt-4 max-w-[9ch] break-words font-display text-[clamp(2.5rem,11vw,5.8rem)] font-semibold leading-[.9] tracking-[-.05em] text-white sm:max-w-[11ch] sm:text-7xl lg:max-w-[13ch] lg:text-[clamp(4rem,5.2vw,5.1rem)] xl:max-w-[14ch] xl:text-[clamp(4.4rem,4.6vw,5.35rem)] 2xl:text-[5.55rem]">
                  <span className="block lg:inline">Better pizza</span>{" "}
                  <span className="block lg:inline">starts</span>{" "}
                  <span className="block lg:inline">before</span>{" "}
                  <span className="block lg:inline">the oven.</span>
                </h1>
                <p className="mt-4 max-w-xl break-words text-base leading-7 text-white/86 sm:text-xl sm:leading-8 lg:text-lg lg:leading-7 xl:text-xl xl:leading-8">
                  {homepageContent.hero.intro}
                </p>
                <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <Link
                    href={homepageContent.hero.primaryCta.href}
                    className="inline-flex min-h-14 w-full items-center justify-center whitespace-nowrap rounded-2xl bg-tomato px-6 py-3 text-base font-extrabold text-white shadow-lg shadow-tomato/20 transition hover:bg-white hover:text-ink active:scale-[.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-forest-dark sm:w-auto sm:px-7"
                  >
                    {homepageContent.hero.primaryCta.label} →
                  </Link>
                  <a
                    href={homepageContent.hero.secondaryCta.href}
                    className="inline-flex min-h-12 w-full items-center justify-center whitespace-nowrap rounded-2xl border border-white/20 bg-white/12 px-6 py-3 text-sm font-extrabold text-white backdrop-blur transition hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-forest-dark sm:w-auto"
                  >
                    {homepageContent.hero.secondaryCta.label}
                  </a>
                </div>
                <ul className="mt-5 grid gap-2 text-sm font-extrabold text-white/86 sm:grid-cols-3" aria-label="DoughTools helps you">
                  {heroValueStatements.map((statement) => (
                    <li key={statement} className="flex items-center gap-2 rounded-2xl bg-white/10 px-3 py-2">
                      <DoughToolsIcon name="success" size={16} className="shrink-0 text-oven-gold" aria-hidden="true" />
                      <span>{statement}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="relative min-h-[19rem] min-w-0 overflow-hidden bg-ink sm:min-h-[28rem] lg:min-h-full" aria-label="Finished pizza and prepared dough">
              <picture>
                <source media="(min-width: 1024px)" srcSet={desktopHeroSrcSet} sizes={desktopHeroSizes} />
                <img
                  {...mobileHeroImageProps}
                  alt="Finished pizza with prepared dough in a warm pizza-making workspace"
                  className="absolute inset-0 h-full w-full object-cover object-[50%_68%] sm:object-[50%_64%] lg:object-[58%_58%] xl:object-[58%_55%]"
                />
              </picture>
              <div className="absolute inset-y-0 left-0 hidden w-24 bg-[linear-gradient(90deg,rgba(9,41,31,0.48),rgba(9,41,31,0))] lg:block" aria-hidden="true" />
              <div className="absolute inset-x-0 bottom-0 h-24 bg-[linear-gradient(180deg,rgba(9,41,31,0)_0%,rgba(9,41,31,0.34)_100%)]" aria-hidden="true" />
            </div>
          </div>
        </div>

        <div className="mx-auto mt-5 max-w-7xl space-y-5">
          <section
            className="rounded-[1.75rem] border border-white/80 bg-white/78 p-4 shadow-sm backdrop-blur-sm sm:p-5"
            aria-labelledby="homepage-session-preview"
          >
            <div className="grid gap-3 md:grid-cols-[0.55fr_1fr] md:items-center">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[.24em] text-leaf">What changes</p>
                <h2 id="homepage-session-preview" className="mt-2 font-display text-2xl font-semibold leading-none">
                  Pizza night feels planned before it feels busy.
                </h2>
              </div>
              <dl className="grid gap-2 sm:grid-cols-3">
                {heroPromiseRows.map((row) => (
                  <div key={row.label} className="rounded-2xl bg-cream/80 px-3 py-2.5 text-sm">
                    <dt className="font-extrabold text-ink/45">{row.label}</dt>
                    <dd className="mt-1 min-w-0 font-extrabold leading-5 text-ink">{row.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </section>
          <ContinuePizzaSessionCard variant="hero" />
        </div>
      </section>

      <section id="how-it-works" className="px-4 py-10 sm:px-6 sm:py-16 lg:px-8" aria-labelledby="homepage-why-heading">
        <div className="mx-auto grid max-w-7xl gap-7 overflow-hidden rounded-[2rem] border border-white/80 bg-white/78 p-5 shadow-card sm:rounded-[2.5rem] sm:p-8 lg:grid-cols-[0.78fr_0.62fr_0.9fr] lg:items-center">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[.28em] text-tomato">Why DoughTools exists</p>
            <h2 id="homepage-why-heading" className="mt-3 font-display text-4xl font-semibold leading-none sm:text-5xl">
              Great pizza shouldn’t depend on guesswork.
            </h2>
            <p className="mt-4 max-w-xl text-base leading-7 text-ink/70">
              Pizza night gets easier when the decisions are already made.
            </p>
            <p className="mt-4 rounded-[1.5rem] bg-leaf/10 p-4 text-sm font-extrabold leading-6 text-leaf">
              DoughTools turns those questions into one calm plan.
            </p>
          </div>
          <Image
            src="/images/shopping/pizza-margherita.webp"
            alt="Finished Margherita pizza with a blistered crust and melted mozzarella"
            width={900}
            height={675}
            sizes="(max-width: 1024px) 100vw, 24vw"
            className="h-64 w-full rounded-[1.75rem] object-cover shadow-card lg:h-96"
          />
          <div className="grid gap-3 sm:grid-cols-2">
            {guessworkQuestions.map((question) => (
              <div key={question} className="rounded-[1.35rem] border border-flour bg-cream/70 p-4 text-sm font-extrabold leading-6 text-ink/72">
                {question}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-10 sm:px-6 sm:py-16 lg:px-8" aria-labelledby="homepage-journey-heading">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-5 lg:grid-cols-[0.72fr_1fr] lg:items-end">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[.28em] text-tomato">How it works</p>
              <h2 id="homepage-journey-heading" className="mt-3 font-display text-4xl font-semibold leading-none sm:text-5xl">
                One plan. Every step.
              </h2>
            </div>
            <p className="text-base leading-7 text-ink/70">
              The result is the slice on the table. The way there is a sequence of small decisions made at the right time.
            </p>
          </div>
          <div className="mt-8 grid gap-5 lg:grid-cols-[0.86fr_1.14fr] lg:items-stretch">
            <figure className="overflow-hidden rounded-[2rem] bg-white/80 shadow-card">
              <Image
                src="/dough-guide/guide-step-08-ball.webp"
                alt="Dough balls prepared for the next stage of pizza making"
                width={1200}
                height={900}
                sizes="(max-width: 1024px) 100vw, 42vw"
                className="h-72 w-full object-cover sm:h-96 lg:h-full"
              />
              <figcaption className="p-5 text-sm font-bold leading-6 text-ink/62">
                A better bake starts before the oven: dough ready, timing clear, next step known.
              </figcaption>
            </figure>

            <div className="grid gap-3">
              {journeyStages.map((stage, index) => (
                <article key={stage.title} className="grid gap-4 rounded-[1.5rem] border border-white/80 bg-white/84 p-4 shadow-sm sm:grid-cols-[3.5rem_1fr] sm:items-center">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-leaf/10 text-leaf" aria-hidden="true">
                    <DoughToolsIcon name={stage.icon} size={24} />
                  </span>
                  <div>
                    <p className="text-xs font-extrabold uppercase tracking-[.22em] text-ink/35">Step {index + 1}</p>
                    <h3 className="mt-1 font-display text-3xl font-semibold leading-none">{stage.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-ink/62">{stage.text}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-10 sm:px-6 sm:py-16 lg:px-8" aria-labelledby="homepage-more-than-calculator-heading">
        <div className="mx-auto grid max-w-7xl gap-7 overflow-hidden rounded-[2rem] bg-forest-dark p-5 text-white shadow-card sm:rounded-[2.5rem] sm:p-8 lg:grid-cols-[0.72fr_1fr] lg:items-center">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[.28em] text-oven-gold">Why it feels different</p>
            <h2 id="homepage-more-than-calculator-heading" className="mt-3 font-display text-4xl font-semibold leading-none sm:text-5xl">
              More than a dough calculator.
            </h2>
            <p className="mt-4 max-w-xl text-base leading-7 text-white/72">
              The numbers matter because they make the evening easier. DoughTools still calculates the dough — but the real value is knowing how that dough becomes pizza without last-minute guessing.
            </p>
          </div>

          <div className="grid gap-3 lg:grid-cols-[0.9fr_1.1fr]">
            <Image
              src="/images/timeline/bake-pizza.webp"
              alt="Pizza baking in a hot oven with a glowing flame"
              width={900}
              height={675}
              sizes="(max-width: 1024px) 100vw, 30vw"
              className="h-72 w-full rounded-[1.75rem] object-cover shadow-overlay lg:h-full"
            />
            <div className="grid gap-3">
              <article className="rounded-[1.5rem] border border-white/10 bg-white/10 p-5">
                <p className="text-xs font-extrabold uppercase tracking-[.22em] text-white/45">Normal calculator</p>
                <h3 className="mt-3 font-display text-3xl font-semibold leading-none">Calculates ingredients.</h3>
                <p className="mt-3 text-sm leading-6 text-white/62">Useful numbers, but the real-life planning is still left for you to connect.</p>
              </article>
              <article className="rounded-[1.5rem] border border-oven-gold/35 bg-oven-gold/12 p-5">
                <p className="text-xs font-extrabold uppercase tracking-[.22em] text-oven-gold">DoughTools</p>
                <h3 className="mt-3 font-display text-3xl font-semibold leading-none">Turns the recipe into a pizza night you can follow.</h3>
                <p className="mt-3 text-sm leading-6 text-white/72">Calculate, plan, shop, prepare, bake and improve without losing the thread.</p>
              </article>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-10 sm:px-6 sm:py-16 lg:px-8" aria-labelledby="homepage-product-action-heading">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-xs font-extrabold uppercase tracking-[.28em] text-leaf">See DoughTools in action</p>
            <h2 id="homepage-product-action-heading" className="mt-3 font-display text-4xl font-semibold leading-none sm:text-5xl">
              You always know what happens next.
            </h2>
            <p className="mt-4 text-base leading-7 text-ink/70">
              Product views create trust only when they answer a practical question. These moments show how the plan turns into action after the pizza already looks worth making.
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

      <section className="px-4 py-10 sm:px-6 sm:py-16 lg:px-8" aria-labelledby="homepage-outcome-heading">
        <div className="mx-auto grid max-w-7xl gap-6 overflow-hidden rounded-[2rem] bg-white/78 p-5 shadow-card sm:rounded-[2.5rem] sm:p-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <Image
            src="/images/timeline/review-result.webp"
            alt="Finished pizza with an airy crust ready to slice and review"
            width={1254}
            height={1254}
            sizes="(max-width: 1024px) 100vw, 48vw"
            className="h-80 w-full rounded-[1.75rem] object-cover shadow-card sm:h-[28rem]"
          />
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[.28em] text-tomato">The result</p>
            <h2 id="homepage-outcome-heading" className="mt-3 font-display text-4xl font-semibold leading-none sm:text-5xl">
              Planning should leave more attention for the pizza.
            </h2>
            <p className="mt-5 text-base leading-7 text-ink/70">
              When the timing, shopping and next actions are already clear, the finished pizza becomes the focus again: the crust, the sauce, the heat, and the next slice.
            </p>
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
        <div className="mx-auto grid max-w-7xl gap-6 overflow-hidden rounded-[2rem] bg-[linear-gradient(135deg,#fff8f1_0%,#ffffff_48%,#f1e6d8_100%)] p-5 shadow-card sm:rounded-[2.5rem] sm:p-8 lg:grid-cols-[0.55fr_0.75fr_1fr] lg:items-center">
          <Image
            src="/about/marcin-arcisz-founder.webp"
            alt="Marcin, the founder of DoughTools"
            width={900}
            height={1200}
            sizes="(max-width: 1024px) 100vw, 28vw"
            className="h-72 w-full rounded-[1.75rem] object-cover object-[50%_35%] shadow-card lg:h-[24rem]"
          />
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[.28em] text-tomato">Founder story</p>
            <h2 id="homepage-founder-heading" className="mt-3 font-display text-4xl font-semibold leading-none sm:text-5xl">
              Built because pizza night was harder to plan than it should be.
            </h2>
          </div>
          <div className="space-y-4 text-base leading-7 text-ink/70">
            <p>
              I did not build DoughTools because the dough numbers were difficult. I built it because planning pizza night was harder.
            </p>
            <p>
              It is a practical companion for better pizza nights — transparent enough to trust, focused enough to use, and still respectful of the craft.
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
            It only takes a few minutes to create your first plan.
          </p>
          <Link
            href={homepageContent.hero.primaryCta.href}
            className="mt-7 inline-flex min-h-14 w-full items-center justify-center rounded-2xl bg-tomato px-7 py-3 text-base font-extrabold text-white shadow-lg shadow-tomato/20 transition hover:bg-white hover:text-ink active:scale-[.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-ink sm:w-auto"
          >
            {homepageContent.hero.primaryCta.label} →
          </Link>
        </div>
      </section>

      <footer className="px-4 pb-8 sm:px-6 sm:pb-10 lg:px-8" aria-label="DoughTools footer" data-homepage-footer>
        <div className="mx-auto grid max-w-7xl gap-7 border-t border-ink/10 pt-7 text-sm text-ink/58 sm:gap-8 sm:pt-8 md:grid-cols-2 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,.85fr)_minmax(0,.85fr)_minmax(0,.65fr)] lg:items-start">
          <section aria-labelledby="homepage-footer-brand">
            <h2 id="homepage-footer-brand" className="font-display text-2xl font-semibold leading-tight text-ink sm:text-3xl">
              Made for better pizza nights.
            </h2>
            <p className="mt-2 max-w-sm text-sm leading-6 text-ink/52">
              Learn the craft, plan the evening, and keep the next useful page within reach.
            </p>
          </section>
          {footerGroups.map((group) => (
            <nav key={group.title} aria-labelledby={`homepage-footer-${group.title.toLowerCase()}`}>
              <h2 id={`homepage-footer-${group.title.toLowerCase()}`} className="text-xs font-extrabold uppercase tracking-[.2em] text-ink/42">
                {group.title}
              </h2>
              <ul className="mt-3 grid grid-cols-1 gap-2 min-[390px]:grid-cols-2 md:grid-cols-1">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="inline-flex min-h-9 items-center rounded-xl py-1.5 font-bold underline-offset-2 transition hover:text-tomato hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-cream">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
      </footer>
    </main>
  );
}
