import Link from "next/link";
import Image from "next/image";
import ContinuePizzaSessionCard from "@/components/ContinuePizzaSessionCard";
import HomeCalculatorWorkspace from "@/components/HomeCalculatorWorkspace";
import HomepageGuidanceLevelSection from "@/components/HomepageGuidanceLevelSection";
import { homepageContent } from "@/lib/homepage";

type HomePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function calculatorViewFor(params: Record<string, string | string[] | undefined> | undefined) {
  if (!params) return null;

  const keys = Object.keys(params);
  if (keys.length === 0) return null;
  if (keys.length === 1 && params.calculator !== undefined) return params.calculator === "2" ? "guided" : "entry";

  return "full";
}

const exampleSessionRows = [
  { label: "Bake time", value: "Saturday 20:00" },
  { label: "Dough", value: "6 × 260 g", detail: "Neapolitan-style" },
  { label: "Fermentation", value: "24h cold", detail: "+ room finish" },
  { label: "Shopping", value: "Flour, tomatoes, mozzarella, basil, yeast, olive oil" },
  { label: "Timeline", value: "Mix Fri 18:30 · Ball Sat 14:00 · Bake Sat 20:00" },
  { label: "Kitchen Mode", value: "Step-by-step guidance while baking" },
];

const benefits = [
  {
    icon: "01",
    title: "Get the dough right",
    text: "Calculate flour, water, salt and yeast based on your pizza count, dough ball size, hydration, yeast type and fermentation plan.",
  },
  {
    icon: "02",
    title: "Know when to start",
    text: "Pick your bake time and follow a clear timeline for mixing, fermentation, balling, resting and baking.",
  },
  {
    icon: "03",
    title: "Stay focused while baking",
    text: "Use simple step-by-step guidance when the oven is hot and you need to move quickly.",
  },
];

const comparisonRows = [
  ["Calculates ingredients", "Plans the whole pizza session"],
  ["You choose timing yourself", "Timeline tells you when to start"],
  ["Shopping is separate", "Shopping list comes from your plan"],
  ["Recipe ends before baking", "Kitchen Mode guides the bake"],
];

export default async function Home({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const calculatorView = calculatorViewFor(params);

  if (calculatorView) {
    return <HomeCalculatorWorkspace variant={calculatorView} />;
  }

  const [heroTitleStart, heroTitleEnd = ""] = homepageContent.hero.h1.split("dough to oven");

  return (
    <main className="min-h-screen overflow-x-clip bg-[radial-gradient(circle_at_12%_0%,rgba(233,75,46,0.10),transparent_32rem),linear-gradient(180deg,#fff8f1_0%,#f6ecdf_46%,#fff8f1_100%)] text-ink">
      <section className="px-4 pb-10 pt-8 sm:px-6 sm:pb-14 sm:pt-12 lg:px-8" aria-labelledby="homepage-hero-heading">
        <div className="mx-auto max-w-7xl">
          <div className="relative overflow-hidden rounded-[2rem] border border-white/80 bg-white/65 shadow-card backdrop-blur sm:rounded-[2.75rem] lg:min-h-[42rem]">
            <div className="absolute inset-y-0 right-0 hidden w-[64%] lg:block" aria-hidden="true">
              <Image
                src="/images/homepage/hero-desktop-bg.png"
                alt=""
                fill
                priority
                sizes="64vw"
                className="object-cover object-[68%_center]"
              />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_76%_14%,rgba(255,255,255,0.20),transparent_16rem),linear-gradient(90deg,rgba(255,248,241,0.98)_0%,rgba(255,248,241,0.62)_28%,rgba(255,248,241,0.05)_58%),linear-gradient(180deg,rgba(15,61,46,0)_56%,rgba(15,61,46,0.24)_100%)]" />
            </div>

            <div className="relative z-10 grid gap-7 p-5 sm:p-8 lg:grid-cols-[minmax(0,0.92fr)_minmax(24rem,0.82fr)] lg:items-center lg:p-10 lg:pb-14">
              <div className="max-w-3xl">
                <p className="text-xs font-extrabold uppercase tracking-[.34em] text-tomato">
                  {homepageContent.hero.eyebrow}
                </p>
                <h1 id="homepage-hero-heading" className="mt-5 font-display text-[clamp(3.25rem,13vw,5rem)] font-semibold leading-[.9] tracking-[-.04em] text-ink sm:text-7xl lg:text-[5.8rem]">
                  {heroTitleStart}
                  <span className="text-leaf">dough to oven</span>
                  {heroTitleEnd}
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
                  <p className="max-w-xs text-xs font-bold leading-5 text-ink/50">
                    No account needed. Your session is saved locally on this device.
                  </p>
                </div>
              </div>

              <div className="relative min-w-0 lg:min-h-[34rem]">
                <div className="relative min-h-[18rem] overflow-hidden rounded-[1.75rem] bg-flour shadow-card sm:min-h-[24rem] lg:hidden">
                  <Image
                    src="/images/homepage/hero-mobile-bg.png"
                    alt="Pizza with basil, mozzarella and tomato sauce on a flour-dusted table"
                    fill
                    priority
                    sizes="100vw"
                    className="object-cover object-[54%_center]"
                  />
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_76%_18%,rgba(255,255,255,0.28),transparent_18rem),linear-gradient(180deg,rgba(15,61,46,0)_42%,rgba(15,61,46,0.28)_100%)]" />
                </div>

                <section
                  className="mt-4 w-full rounded-[1.75rem] border border-white/80 bg-white/90 p-4 shadow-card backdrop-blur-md sm:p-5 lg:absolute lg:left-0 lg:top-8 lg:mt-0 lg:max-w-[24rem]"
                  aria-labelledby="example-session-heading"
                >
                  <p className="text-xs font-extrabold uppercase tracking-[.24em] text-leaf">Example session</p>
                  <h2 id="example-session-heading" className="mt-2 font-display text-2xl font-semibold leading-none">
                    From target time to kitchen steps.
                  </h2>
                  <div className="mt-4 grid gap-2">
                    {exampleSessionRows.map((row) => (
                      <div key={row.label} className="grid grid-cols-[6.7rem_1fr] gap-3 rounded-2xl bg-cream/80 px-3 py-2.5 text-sm">
                        <p className="font-extrabold text-ink/45">{row.label}</p>
                        <div className="min-w-0">
                          <p className="font-extrabold leading-5 text-ink">{row.value}</p>
                          {row.detail && <p className="text-xs font-bold leading-5 text-ink/55">{row.detail}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto mt-10 max-w-7xl">
          <ContinuePizzaSessionCard variant="hero" />
        </div>
      </section>

      <section className="px-4 py-10 sm:px-6 sm:py-14 lg:px-8" aria-labelledby="homepage-benefits-heading">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-xs font-extrabold uppercase tracking-[.28em] text-tomato">Pizza Session</p>
            <h2 id="homepage-benefits-heading" className="mt-3 font-display text-4xl font-semibold leading-none sm:text-5xl">
              Everything you need for a better pizza session
            </h2>
          </div>
          <div className="mt-7 grid gap-4 md:grid-cols-3">
            {benefits.map((benefit) => (
              <article key={benefit.title} className="rounded-[1.75rem] border border-white/80 bg-white/80 p-5 shadow-sm sm:p-6">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-leaf/10 text-xs font-black text-leaf" aria-hidden="true">
                  {benefit.icon}
                </span>
                <h3 className="mt-5 font-display text-3xl font-semibold leading-none">{benefit.title}</h3>
                <p className="mt-3 text-sm leading-6 text-ink/62">{benefit.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-10 sm:px-6 sm:py-14 lg:px-8" aria-labelledby="homepage-experience-heading">
        <div className="mx-auto grid max-w-7xl gap-6 rounded-[2rem] border border-white/80 bg-white/65 p-5 shadow-card sm:rounded-[2.5rem] sm:p-7 lg:grid-cols-[0.75fr_1fr] lg:items-center">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[.28em] text-tomato">Guidance</p>
            <h2 id="homepage-experience-heading" className="mt-3 font-display text-4xl font-semibold leading-none sm:text-5xl">
              Guidance that fits your skill level
            </h2>
            <div className="mt-5 grid gap-3 text-sm leading-6 text-ink/65 sm:grid-cols-3 lg:grid-cols-1">
              <p><strong className="text-ink">Beginner:</strong> Clear steps, less theory.</p>
              <p><strong className="text-ink">Enthusiast:</strong> More control and helpful explanations.</p>
              <p><strong className="text-ink">Pizza Nerd:</strong> Technical details, percentages and variables.</p>
            </div>
          </div>
          <HomepageGuidanceLevelSection />
        </div>
      </section>

      <section className="px-4 py-10 sm:px-6 sm:py-14 lg:px-8" aria-labelledby="homepage-comparison-heading">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-7 lg:grid-cols-[0.8fr_1fr] lg:items-start">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[.28em] text-leaf">Why it matters</p>
              <h2 id="homepage-comparison-heading" className="mt-3 font-display text-4xl font-semibold leading-none sm:text-5xl">
                More than a dough calculator
              </h2>
              <p className="mt-4 max-w-xl text-base leading-7 text-ink/68">
                Most pizza tools calculate ingredients. DoughTools helps you plan the whole session: dough, timing, shopping and baking steps in one flow.
              </p>
            </div>

            <div className="overflow-hidden rounded-[1.75rem] border border-white/80 bg-white/85 shadow-card">
              <div className="hidden grid-cols-2 border-b border-ink/10 bg-leaf/10 text-sm font-extrabold text-leaf sm:grid">
                <p className="border-r border-ink/10 p-4">Normal calculator</p>
                <p className="p-4">DoughTools</p>
              </div>
              <div className="hidden sm:block">
                {comparisonRows.map(([normal, doughTools]) => (
                  <div key={normal} className="grid grid-cols-2 border-b border-ink/10 last:border-b-0">
                    <p className="border-r border-ink/10 p-4 text-sm font-bold leading-6 text-ink/55">{normal}</p>
                    <p className="p-4 text-sm font-extrabold leading-6 text-ink">{doughTools}</p>
                  </div>
                ))}
              </div>
              <div className="grid gap-3 p-3 sm:hidden">
                {comparisonRows.map(([normal, doughTools]) => (
                  <article key={normal} className="rounded-2xl bg-cream/80 p-4">
                    <p className="text-xs font-extrabold uppercase tracking-[.18em] text-ink/40">Normal calculator</p>
                    <p className="mt-1 text-sm font-bold text-ink/60">{normal}</p>
                    <p className="mt-3 text-xs font-extrabold uppercase tracking-[.18em] text-leaf">DoughTools</p>
                    <p className="mt-1 text-sm font-extrabold text-ink">{doughTools}</p>
                  </article>
                ))}
              </div>
            </div>
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
