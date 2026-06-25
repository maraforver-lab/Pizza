import Link from "next/link";
import AppSignature from "@/components/AppSignature";
import ContinuePizzaSessionCard from "@/components/ContinuePizzaSessionCard";
import HomeCalculatorWorkspace from "@/components/HomeCalculatorWorkspace";
import InstallAppPrompt from "@/components/InstallAppPrompt";
import { homepageContent } from "@/lib/homepage";

type HomePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function hasCalculatorRequest(params: Record<string, string | string[] | undefined> | undefined) {
  if (!params) return false;
  return Object.keys(params).length > 0;
}

export default async function Home({ searchParams }: HomePageProps) {
  const params = await searchParams;

  if (hasCalculatorRequest(params)) {
    return <HomeCalculatorWorkspace />;
  }

  return (
    <main className="min-h-screen bg-cream text-ink">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between gap-4">
          <AppSignature />
          <Link
            href={homepageContent.hero.secondaryCta.href}
            className="hidden rounded-full border border-ink/10 bg-white px-4 py-2 text-sm font-extrabold text-ink shadow-sm transition hover:border-tomato/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-cream sm:inline-flex"
          >
            {homepageContent.hero.secondaryCta.label}
          </Link>
        </header>

        <section className="grid gap-8 rounded-[2rem] bg-white p-6 shadow-card sm:p-8 lg:grid-cols-[1.1fr_.9fr] lg:items-center lg:p-10" aria-labelledby="homepage-hero-heading">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[.22em] text-tomato">{homepageContent.hero.eyebrow}</p>
            <h1 id="homepage-hero-heading" className="mt-4 max-w-3xl font-display text-5xl font-semibold leading-[.92] text-ink sm:text-6xl lg:text-7xl">
              {homepageContent.hero.h1}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-ink/65 sm:text-lg">
              {homepageContent.hero.intro}
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                href={homepageContent.hero.primaryCta.href}
                className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-tomato px-6 py-3 text-sm font-extrabold text-white shadow-sm transition active:scale-[.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
              >
                {homepageContent.hero.primaryCta.label} →
              </Link>
              <Link
                href={homepageContent.hero.secondaryCta.href}
                className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-ink/10 bg-cream px-6 py-3 text-sm font-extrabold text-ink transition active:scale-[.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-white"
              >
                {homepageContent.hero.secondaryCta.label}
              </Link>
              <Link
                href={homepageContent.hero.learnCta.href}
                className="inline-flex min-h-12 items-center justify-center rounded-2xl px-6 py-3 text-sm font-extrabold text-ink/60 transition hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-white"
              >
                {homepageContent.hero.learnCta.label}
              </Link>
            </div>
            <p className="mt-4 text-xs leading-5 text-ink/45">
              Pizza Sessions are saved locally in this browser on this device for now.
            </p>
          </div>

          <div className="rounded-[1.75rem] border border-leaf/15 bg-leaf/[.07] p-5 sm:p-6">
            <p className="text-xs font-extrabold uppercase tracking-[.2em] text-leaf">How it helps</p>
            <ul className="mt-4 grid gap-3">
              {homepageContent.benefits.map((benefit) => (
                <li key={benefit} className="flex gap-3 text-sm leading-6 text-ink/65">
                  <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-leaf" aria-hidden="true" />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <ContinuePizzaSessionCard />

        <section aria-labelledby="homepage-flow-heading">
          <div className="max-w-2xl">
            <p className="text-xs font-extrabold uppercase tracking-[.2em] text-tomato">One guided path</p>
            <h2 id="homepage-flow-heading" className="mt-3 font-display text-3xl font-semibold text-ink sm:text-4xl">
              How a Pizza Session works
            </h2>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {homepageContent.workflow.map((step, index) => (
              <article key={step.title} className="rounded-[1.5rem] border border-ink/10 bg-white p-5 shadow-sm">
                <p className="text-xs font-extrabold uppercase tracking-[.18em] text-tomato">{String(index + 1).padStart(2, "0")}</p>
                <h3 className="mt-3 text-lg font-extrabold text-ink">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-ink/60">{step.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[.8fr_1.2fr]" aria-labelledby="homepage-tools-heading">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[.2em] text-ink/45">Secondary tools</p>
            <h2 id="homepage-tools-heading" className="mt-3 font-display text-3xl font-semibold text-ink">
              Need a specific tool?
            </h2>
            <p className="mt-3 text-sm leading-6 text-ink/60">
              The guided session is the main path. The individual tools remain available when you already know what you need.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {homepageContent.coreTools.map((tool) => (
              <Link
                key={tool.name}
                href={tool.href}
                className="rounded-[1.35rem] border border-ink/10 bg-white p-4 shadow-sm transition hover:border-tomato/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
              >
                <span className="block text-sm font-extrabold text-ink">{tool.name}</span>
                <span className="mt-1 block text-xs leading-5 text-ink/55">{tool.description}</span>
                <span className="mt-3 inline-flex text-xs font-extrabold text-tomato">{tool.action} →</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="grid gap-6 rounded-[1.75rem] border border-ink/10 bg-white p-5 shadow-sm sm:p-6 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <h2 className="font-display text-2xl font-semibold text-ink">Prefer learning first?</h2>
            <p className="mt-2 text-sm leading-6 text-ink/60">
              Guides, oven notes and troubleshooting stay available without making the first screen feel like a toolbox.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {homepageContent.secondaryTools.map((tool) => (
                <Link
                  key={tool.href}
                  href={tool.href}
                  className="rounded-full border border-ink/10 bg-cream px-3 py-2 text-xs font-extrabold text-ink/65 transition hover:border-tomato/30 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                >
                  {tool.name}
                </Link>
              ))}
            </div>
          </div>
          <InstallAppPrompt className="lg:max-w-sm" />
        </section>
      </div>
    </main>
  );
}
