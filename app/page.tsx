import Link from "next/link";
import Image from "next/image";
import ContinuePizzaSessionCard from "@/components/ContinuePizzaSessionCard";
import HomeCalculatorWorkspace from "@/components/HomeCalculatorWorkspace";
import HomepageGuidanceLevelSection from "@/components/HomepageGuidanceLevelSection";
import { DoughToolsIcon, type DoughToolsIconName } from "@/components/icons";
import { homepageContent } from "@/lib/homepage";

type HomePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

type WorkflowStage = {
  title: string;
  text: string;
  icon: DoughToolsIconName;
};

type ProductPreview = {
  title: string;
  text: string;
  image: string;
  alt: string;
};

function calculatorViewFor(params: Record<string, string | string[] | undefined> | undefined) {
  if (!params) return null;

  const keys = Object.keys(params);
  if (keys.length === 0) return null;
  if (keys.length === 1 && params.calculator !== undefined) return params.calculator === "2" ? "guided" : "entry";

  return "full";
}

const heroPlanRows = [
  { label: "Dough Plan", value: "6 × 260 g · 24h cold" },
  { label: "Shopping", value: "Flour, tomatoes, mozzarella, basil" },
  { label: "Timeline", value: "Mix Fri 18:30 · Ball Sat 14:00" },
  { label: "Kitchen Mode", value: "Current action, one step at a time" },
];

const workflowStages: WorkflowStage[] = [
  {
    title: "Plan",
    text: "Get a realistic recipe and fermentation plan from your pizza idea.",
    icon: "checklist",
  },
  {
    title: "Shop",
    text: "Turn the plan into clear ingredient guidance before you start.",
    icon: "shopping-basket",
  },
  {
    title: "Prepare",
    text: "Follow the timeline so mixing, balling and resting happen on time.",
    icon: "timeline",
  },
  {
    title: "Bake",
    text: "Use Kitchen Mode when the oven is hot and the next action matters.",
    icon: "kitchen-mode",
  },
  {
    title: "Improve",
    text: "Review the bake and keep learning from what actually happened.",
    icon: "experience-level",
  },
];

const productPreviews: ProductPreview[] = [
  {
    title: "Dough Plan",
    text: "Ingredient amounts, dough-ball size, yeast and fermentation guidance stay together.",
    image: "/dough-guide/guide-step-02-measure.webp",
    alt: "Measured pizza dough ingredients prepared for a dough plan",
  },
  {
    title: "Shopping",
    text: "Pizza choices become a practical shopping list instead of a separate note.",
    image: "/images/shopping/pizza-margherita.webp",
    alt: "Fresh Margherita pizza representing the shopping and pizza menu flow",
  },
  {
    title: "Timeline",
    text: "The plan becomes clock-time steps for mixing, fermenting, preheating and baking.",
    image: "/images/timeline/preheat-oven.webp",
    alt: "A warm pizza oven preheating for the timeline step",
  },
  {
    title: "Kitchen Mode",
    text: "During the bake, the interface focuses on the current action and practical guidance.",
    image: "/images/timeline/bake-pizza.webp",
    alt: "Pizza baking in a hot oven for Kitchen Mode guidance",
  },
];

export default async function Home({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const calculatorView = calculatorViewFor(params);

  if (calculatorView) {
    return <HomeCalculatorWorkspace variant={calculatorView} />;
  }

  return (
    <main className="min-h-screen overflow-x-clip bg-[radial-gradient(circle_at_12%_0%,rgba(233,75,46,0.10),transparent_32rem),linear-gradient(180deg,#fff8f1_0%,#f1e6d8_46%,#fff8f1_100%)] text-ink">
      <section className="px-4 pb-9 pt-7 sm:px-6 sm:pb-14 sm:pt-12 lg:px-8" aria-labelledby="homepage-hero-heading">
        <div className="mx-auto max-w-7xl">
          <div className="relative overflow-hidden rounded-[2rem] border border-white/80 bg-white/70 shadow-card backdrop-blur sm:rounded-[2.75rem] lg:min-h-[43rem]">
            <div className="absolute inset-y-0 right-0 hidden w-[62%] lg:block" aria-hidden="true">
              <Image
                src="/images/homepage/hero-desktop-bg.png"
                alt=""
                fill
                priority
                sizes="62vw"
                className="object-cover object-[68%_center]"
              />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_14%,rgba(255,255,255,0.18),transparent_18rem),linear-gradient(90deg,rgba(255,248,241,0.99)_0%,rgba(255,248,241,0.72)_31%,rgba(255,248,241,0.06)_62%),linear-gradient(180deg,rgba(15,61,46,0)_58%,rgba(15,61,46,0.28)_100%)]" />
            </div>

            <div className="relative z-10 grid gap-7 p-5 sm:p-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(24rem,0.86fr)] lg:items-center lg:p-10 lg:pb-14">
              <div className="max-w-3xl">
                <p className="text-xs font-extrabold uppercase tracking-[.34em] text-tomato">
                  {homepageContent.hero.eyebrow}
                </p>
                <h1 id="homepage-hero-heading" className="mt-5 font-display text-[clamp(3.2rem,12vw,5rem)] font-semibold leading-[.9] tracking-[-.04em] text-ink sm:text-7xl lg:text-[5.75rem]">
                  {homepageContent.hero.h1}
                </h1>
                <p className="mt-6 max-w-2xl text-base leading-7 text-ink/70 sm:text-xl sm:leading-8">
                  {homepageContent.hero.intro}
                </p>
                <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <Link
                    href={homepageContent.hero.primaryCta.href}
                    className="inline-flex min-h-14 items-center justify-center rounded-2xl bg-tomato px-7 py-3 text-base font-extrabold text-white shadow-lg shadow-tomato/20 transition active:scale-[.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
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
              </div>

              <div className="relative min-w-0 lg:min-h-[34rem]">
                <div className="relative overflow-hidden rounded-[1.75rem] bg-flour shadow-card lg:absolute lg:inset-x-0 lg:bottom-2 lg:top-2">
                  <Image
                    src="/images/homepage/hero-mobile-bg.png"
                    alt="Finished pizza on a warm table beside a DoughTools planning preview"
                    width={1400}
                    height={1050}
                    priority
                    sizes="(max-width: 1023px) 100vw, 38vw"
                    className="h-[18rem] w-full object-cover object-[54%_center] sm:h-[24rem] lg:h-full"
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,61,46,0)_34%,rgba(15,61,46,0.42)_100%)]" />
                </div>

                <section
                  className="relative mt-4 w-full rounded-[1.75rem] border border-white/80 bg-white/90 p-4 shadow-card backdrop-blur-md sm:p-5 lg:absolute lg:left-0 lg:top-8 lg:mt-0 lg:max-w-[24rem]"
                  aria-labelledby="homepage-product-plan-preview"
                >
                  <p className="text-xs font-extrabold uppercase tracking-[.24em] text-leaf">Pizza Session preview</p>
                  <h2 id="homepage-product-plan-preview" className="mt-2 font-display text-2xl font-semibold leading-none">
                    One plan from idea to bake.
                  </h2>
                  <dl className="mt-4 grid gap-2">
                    {heroPlanRows.map((row) => (
                      <div key={row.label} className="grid grid-cols-[6.8rem_1fr] gap-3 rounded-2xl bg-cream/80 px-3 py-2.5 text-sm">
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

      <section id="how-it-works" className="px-4 py-10 sm:px-6 sm:py-14 lg:px-8" aria-labelledby="homepage-workflow-heading">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-xs font-extrabold uppercase tracking-[.28em] text-tomato">Pizza Session</p>
            <h2 id="homepage-workflow-heading" className="mt-3 font-display text-4xl font-semibold leading-none sm:text-5xl">
              One plan. Every step.
            </h2>
            <p className="mt-4 text-base leading-7 text-ink/70">
              DoughTools keeps the important parts of pizza night connected, so the recipe, shopping list, timeline, kitchen guidance and review path all come from the same plan.
            </p>
          </div>
          <div className="mt-7 grid gap-4 md:grid-cols-5">
            {workflowStages.map((stage) => (
              <article key={stage.title} className="rounded-[1.5rem] border border-white/80 bg-white/80 p-5 shadow-sm">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-leaf/10 text-leaf" aria-hidden="true">
                  <DoughToolsIcon name={stage.icon} size={24} />
                </span>
                <h3 className="mt-5 font-display text-3xl font-semibold leading-none">{stage.title}</h3>
                <p className="mt-3 text-sm leading-6 text-ink/62">{stage.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-10 sm:px-6 sm:py-14 lg:px-8" aria-labelledby="homepage-more-than-calculator-heading">
        <div className="mx-auto grid max-w-7xl gap-7 rounded-[2rem] bg-forest-dark p-5 text-white shadow-card sm:rounded-[2.5rem] sm:p-8 lg:grid-cols-[0.8fr_1fr] lg:items-center">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[.28em] text-oven-gold">Why it feels different</p>
            <h2 id="homepage-more-than-calculator-heading" className="mt-3 font-display text-4xl font-semibold leading-none sm:text-5xl">
              More than a dough calculator
            </h2>
            <p className="mt-4 max-w-xl text-base leading-7 text-white/72">
              A normal calculator gives ingredient quantities. DoughTools creates the recipe, shopping guidance, timeline, Kitchen Mode workflow, and review path around the pizza night you actually want.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <article className="rounded-[1.5rem] border border-white/10 bg-white/10 p-5">
              <p className="text-xs font-extrabold uppercase tracking-[.22em] text-white/45">Calculator</p>
              <h3 className="mt-3 font-display text-3xl font-semibold leading-none">Ingredients only</h3>
              <p className="mt-3 text-sm leading-6 text-white/62">Useful for numbers, but the timing, shopping and kitchen decisions stay separate.</p>
            </article>
            <article className="rounded-[1.5rem] border border-oven-gold/35 bg-oven-gold/12 p-5">
              <p className="text-xs font-extrabold uppercase tracking-[.22em] text-oven-gold">DoughTools</p>
              <h3 className="mt-3 font-display text-3xl font-semibold leading-none">A complete session</h3>
              <p className="mt-3 text-sm leading-6 text-white/72">One connected workflow carries the plan from dough amounts to the final bake.</p>
            </article>
          </div>
        </div>
      </section>

      <section className="px-4 py-10 sm:px-6 sm:py-14 lg:px-8" aria-labelledby="homepage-product-preview-heading">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-5 lg:grid-cols-[0.72fr_1fr] lg:items-end">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[.28em] text-leaf">Real product flow</p>
              <h2 id="homepage-product-preview-heading" className="mt-3 font-display text-4xl font-semibold leading-none sm:text-5xl">
                It does not stop after calculating ingredients.
              </h2>
            </div>
            <p className="text-base leading-7 text-ink/70">
              The same Pizza Session continues into the Dough Plan, Shopping, Timeline, Kitchen Mode and Review screens, so the next practical step stays visible.
            </p>
          </div>

          <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {productPreviews.map((preview) => (
              <article key={preview.title} className="overflow-hidden rounded-[1.75rem] border border-white/80 bg-white/85 shadow-card">
                <Image
                  src={preview.image}
                  alt={preview.alt}
                  width={900}
                  height={675}
                  sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 25vw"
                  className="h-44 w-full object-cover"
                />
                <div className="p-5">
                  <h3 className="font-display text-3xl font-semibold leading-none">{preview.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-ink/62">{preview.text}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-10 sm:px-6 sm:py-14 lg:px-8" aria-labelledby="homepage-experience-heading">
        <div className="mx-auto grid max-w-7xl gap-6 rounded-[2rem] border border-white/80 bg-white/70 p-5 shadow-card sm:rounded-[2.5rem] sm:p-7 lg:grid-cols-[0.76fr_1fr] lg:items-center">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[.28em] text-tomato">Experience levels</p>
            <h2 id="homepage-experience-heading" className="mt-3 font-display text-4xl font-semibold leading-none sm:text-5xl">
              One planning engine. Guidance matched to your experience.
            </h2>
            <div className="mt-5 grid gap-3 text-sm leading-6 text-ink/65 sm:grid-cols-3 lg:grid-cols-1">
              <p><strong className="text-ink">Beginner:</strong> simpler decisions and clearer guidance.</p>
              <p><strong className="text-ink">Enthusiast:</strong> more explanation and control.</p>
              <p><strong className="text-ink">Pizza Nerd:</strong> advanced parameters and overrides.</p>
            </div>
            <p className="mt-4 rounded-2xl bg-cream/70 p-4 text-sm font-bold leading-6 text-ink/58">
              The calculations stay the same. The explanation changes.
            </p>
          </div>
          <HomepageGuidanceLevelSection />
        </div>
      </section>

      <section className="px-4 py-10 sm:px-6 sm:py-14 lg:px-8" aria-labelledby="homepage-trust-heading">
        <div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-[0.8fr_1fr] lg:items-start">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[.28em] text-tomato">Trust and craft</p>
            <h2 id="homepage-trust-heading" className="mt-3 font-display text-4xl font-semibold leading-none sm:text-5xl">
              Built for practical pizza nights.
            </h2>
            <p className="mt-4 text-base leading-7 text-ink/70">
              DoughTools is founder-led, transparent about its calculations, and careful about privacy. It helps you plan better without pretending the craft disappears.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {homepageContent.trust.map((item) => (
              <article key={item} className="rounded-[1.4rem] border border-white/80 bg-white/80 p-5 shadow-sm">
                <span className="grid h-10 w-10 place-items-center rounded-2xl bg-leaf/10 text-leaf" aria-hidden="true">
                  <DoughToolsIcon name="check" size={20} />
                </span>
                <h3 className="mt-4 text-base font-extrabold text-ink">{item}</h3>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-12 sm:px-6 sm:py-16 lg:px-8" aria-labelledby="homepage-final-cta-heading">
        <div className="mx-auto max-w-5xl rounded-[2rem] border border-white/80 bg-ink p-6 text-center text-white shadow-card sm:rounded-[2.5rem] sm:p-10">
          <h2 id="homepage-final-cta-heading" className="font-display text-4xl font-semibold leading-none sm:text-6xl">
            Ready to plan your next pizza night?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-white/72 sm:text-base sm:leading-7">
            Start with your bake time, number of pizzas and dough style. DoughTools builds the rest of the session around it.
          </p>
          <Link
            href={homepageContent.hero.primaryCta.href}
            className="mt-7 inline-flex min-h-14 w-full items-center justify-center rounded-2xl bg-tomato px-7 py-3 text-base font-extrabold text-white shadow-lg shadow-tomato/20 transition active:scale-[.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-ink sm:w-auto"
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
